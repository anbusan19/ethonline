// Vault402 — the agent's x402-gated order endpoint (resource server).
//
// NEW this event. Flat 1 HBAR service fee per order, settled on Hedera testnet
// through Blocky402 (x402 v2). Paying this endpoint authorizes the agent to shop —
// it is NOT the grocery purchase itself (see src/orders/pipeline.ts, which writes the
// real Zepto Cash purchase to PurchaseLog only after independent verification).
//
// payTo is AGENT_HEDERA_ACCOUNT_ID — a separate account from the buyer's
// HEDERA_OPERATOR_ID (see scripts/create-agent-hedera-account.ts), so the settled
// transfer is between two real, distinct parties, not a self-pay demo.

import express from "express";
import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";
import { paymentMiddleware } from "@x402/express";
import { ExactHederaScheme } from "@x402/hedera/exact/server";
import type { SettleResponse, Network } from "@x402/core/types";
import { randomUUID } from "node:crypto";
import { env } from "../config/env.js";
import { createOrder, getOrder, updateOrder } from "../orders/store.js";
import { runCheckoutPipeline } from "../orders/pipeline.js";

const HEDERA_NETWORK: Network = "hedera:testnet";
const SERVICE_FEE_HBAR = 1;

const app = express();
app.use(express.json());

const facilitator = new HTTPFacilitatorClient({ url: env.blocky402FacilitatorUrl() });
const resourceServer = new x402ResourceServer(facilitator).register(HEDERA_NETWORK, new ExactHederaScheme());

// Demo-scope simplification: captures the most recently settled payment so the very
// next route handler (running in the same request, immediately after this hook) can
// read it. Fine for one request in flight at a time; a real multi-tenant deployment
// would thread this through transportContext or a per-request store instead.
let lastSettlement: SettleResponse | null = null;
resourceServer.onAfterSettle(async (ctx) => {
  lastSettlement = ctx.result;
  console.log(`[x402] Payment settled: tx=${ctx.result?.transaction} payer=${ctx.result?.payer} success=${ctx.result?.success}`);
});

// @x402/hedera only ships default-asset lookups for USD-pegged HTS tokens, not HBAR
// directly — an AssetAmount naming asset "0.0.0" (HBAR) explicitly sidesteps that
// lookup instead of relying on a "1 HBAR" ticker-suffixed Money string. HBAR has 8
// decimals (1 HBAR = 100,000,000 tinybar) — CLAUDE.md: never read a price as a
// literal unit without checking; this literally IS the HBAR amount, tinybar-denominated.
const SERVICE_FEE_TINYBAR = String(SERVICE_FEE_HBAR * 100_000_000);

const routes = {
  "POST /order": {
    accepts: {
      scheme: "exact" as const,
      price: { asset: "0.0.0", amount: SERVICE_FEE_TINYBAR },
      network: HEDERA_NETWORK,
      payTo: env.agentHederaAccountId(),
      // Hedera's default payment flow is "authorization" (settle only AFTER the
      // handler succeeds) — found by testing: the handler saw no settlement at all
      // under the default. "upfront" settles before the handler runs, matching
      // CLAUDE.md's described flow (buyer signs, facilitator submits, then the
      // agent proceeds) and letting the handler use real settlement proof.
      extra: { paymentFlow: "upfront" },
    },
    description: "Authorizes the agent to place one grocery order on your behalf.",
    mimeType: "application/json",
  },
};

app.use(paymentMiddleware(routes, resourceServer));

app.post("/order", async (req, res) => {
  const items: unknown = req.body?.items;
  if (!Array.isArray(items) || items.length === 0 || !items.every((i) => typeof i === "string")) {
    res.status(400).json({ error: "Body must be { items: string[] } — a non-empty shopping list." });
    return;
  }

  const settlement = lastSettlement;
  if (!settlement || !settlement.success) {
    // Should be unreachable — paymentMiddleware only calls next() after a successful
    // settle — but never write an order record without real settlement proof.
    console.warn(`[order] POST /order rejected — no settled payment on record.`);
    res.status(402).json({ error: "Payment was not confirmed settled." });
    return;
  }

  const orderId = randomUUID();
  console.log(`[order] Creating order ${orderId} for items: ${(items as string[]).join(", ")}`);
  await createOrder(orderId, items as string[], {
    transactionId: settlement.transaction,
    amountHbar: SERVICE_FEE_HBAR,
    payer: settlement.payer ?? "unknown",
  });

  console.log(`[order] Order ${orderId} created — firing checkout pipeline.`);
  res.status(202).json({ orderId, status: "payment_settled" });

  // Fire-and-forget: checkout can take a while (real browser automation) and may
  // pause on insufficient funds — the buyer polls GET /orders/:id or waits for the
  // Telegram notification, not this HTTP response.
  runCheckoutPipeline(orderId).catch((err) => {
    console.error(`[order] Order ${orderId} pipeline crashed:`, err);
  });
});

app.get("/orders/:id", async (req, res) => {
  const order = await getOrder(req.params.id);
  if (!order) {
    res.status(404).json({ error: "Order not found." });
    return;
  }
  res.json(order);
});

app.post("/orders/:id/resume", async (req, res) => {
  const order = await getOrder(req.params.id);
  if (!order) {
    res.status(404).json({ error: "Order not found." });
    return;
  }
  console.log(`[order] Resuming order ${order.id} (was: ${order.status})`);
  res.status(202).json({ status: "resuming" });
  runCheckoutPipeline(order.id).catch((err) => {
    console.error(`[order] Order ${order.id} resume crashed:`, err);
  });
});

app.post("/orders/:id/cancel", async (req, res) => {
  const order = await getOrder(req.params.id);
  if (!order) {
    res.status(404).json({ error: "Order not found." });
    return;
  }
  if (order.status === "completed") {
    res.status(409).json({ error: "Order already completed — cannot cancel." });
    return;
  }
  const updated = await updateOrder(order.id, {
    status: "canceled",
    failureReason: "Canceled by buyer. The 1 HBAR service fee is not refunded (no reverse-x402 mechanism).",
  });
  res.json(updated);
});

const PORT = Number(process.env.PORT ?? 4021);
app.listen(PORT, () => {
  console.log(`Vault402 order endpoint listening on :${PORT}`);
  console.log(`  POST /order              { items: string[] } — x402-gated, ${SERVICE_FEE_HBAR} HBAR`);
  console.log(`  GET  /orders/:id         check status`);
  console.log(`  POST /orders/:id/resume  retry after topping up Zepto Cash`);
  console.log(`  POST /orders/:id/cancel  abandon (fee not refunded)`);
});
