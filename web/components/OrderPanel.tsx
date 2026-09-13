"use client";

// Replaces ChatPanel's placeholder — this is the real order flow, browser-driven.
// Payment itself happens server-side (see app/api/create-order/route.ts): the Ledger
// Key Ring decrypt and Hedera signing never touch the browser.

import { useEffect, useRef, useState } from "react";

interface ZeptoCartItem {
  name: string;
  quantity: number;
  price: string | null;
}

interface Order {
  id: string;
  status:
    | "payment_settled"
    | "checking_out"
    | "awaiting_user_decision"
    | "completed"
    | "canceled"
    | "failed";
  items: string[];
  x402: { transactionId: string; amountHbar: number; payer: string };
  zepto?: { items: ZeptoCartItem[]; total: string | null; orderId: string | null; purchaseLogTxHashes: string[] };
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_LABEL: Record<Order["status"], string> = {
  payment_settled: "Payment settled — starting checkout",
  checking_out: "Checking out on Zepto…",
  awaiting_user_decision: "Needs your decision",
  completed: "Completed",
  canceled: "Canceled",
  failed: "Failed",
};

const STATUS_COLOR: Record<Order["status"], string> = {
  payment_settled: "text-blue-400 border-blue-500/40 bg-blue-500/10",
  checking_out: "text-blue-400 border-blue-500/40 bg-blue-500/10",
  awaiting_user_decision: "text-amber-400 border-amber-500/40 bg-amber-500/10",
  completed: "text-green-400 border-green-500/40 bg-green-500/10",
  canceled: "text-gray-400 border-gray-500/40 bg-gray-500/10",
  failed: "text-red-400 border-red-500/40 bg-red-500/10",
};

export default function OrderPanel() {
  const [itemsText, setItemsText] = useState("");
  const [paying, setPaying] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<"resume" | "cancel" | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  function startPolling(orderId: string) {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const res = await fetch(`/api/orders/${orderId}`, { cache: "no-store" });
      if (!res.ok) return;
      const data: Order = await res.json();
      setOrder(data);
      if (data.status === "completed" || data.status === "canceled" || data.status === "failed") {
        if (pollRef.current) clearInterval(pollRef.current);
      }
    }, 3000);
  }

  async function payAndOrder() {
    const items = itemsText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (items.length === 0) return;

    setPaying(true);
    setError(null);
    setOrder(null);

    try {
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Payment failed.");
        return;
      }

      const statusRes = await fetch(`/api/orders/${data.orderId}`, { cache: "no-store" });
      setOrder(await statusRes.json());
      startPolling(data.orderId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPaying(false);
    }
  }

  async function act(action: "resume" | "cancel") {
    if (!order) return;
    setBusyAction(action);
    try {
      await fetch(`/api/orders/${order.id}/${action}`, { method: "POST" });
      startPolling(order.id);
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <div className="chat">
      <div className="chat__head">
        <span className="chat__brand">// VAULT402 — PLACE AN ORDER</span>
      </div>

      <div className="chat__scroll">
        {!order && (
          <div className="chat__empty">
            <p className="chat__greeting">What do you need restocked?</p>
            <p className="chat__empty-sub">One item per line — paying 1 HBAR authorizes the agent to shop</p>
          </div>
        )}

        {order && (
          <div className="order-card">
            <div className="order-card__row">
              <span className={`order-card__badge ${STATUS_COLOR[order.status]}`}>{STATUS_LABEL[order.status]}</span>
              <span className="order-card__id">#{order.id.slice(0, 8)}</span>
            </div>

            <div className="order-card__section">
              <span className="order-card__label">Requested</span>
              <ul className="order-card__list">
                {order.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="order-card__section">
              <span className="order-card__label">x402 service fee (Hedera testnet)</span>
              <p className="order-card__mono">
                {order.x402.amountHbar} HBAR — tx {order.x402.transactionId}
              </p>
            </div>

            {order.zepto && (
              <div className="order-card__section">
                <span className="order-card__label">Zepto product purchase</span>
                <ul className="order-card__list">
                  {order.zepto.items.map((item, i) => (
                    <li key={i}>
                      {item.name} × {item.quantity} — {item.price}
                    </li>
                  ))}
                </ul>
                <p className="order-card__mono">
                  Total {order.zepto.total} — Zepto order {order.zepto.orderId}
                </p>
                {order.zepto.purchaseLogTxHashes.length > 0 && (
                  <p className="order-card__mono">
                    PurchaseLog: {order.zepto.purchaseLogTxHashes.length} tx(s) on Ethereum Sepolia
                  </p>
                )}
              </div>
            )}

            {order.failureReason && (
              <div className="order-card__section">
                <span className="order-card__label">Note</span>
                <p className="order-card__error">{order.failureReason}</p>
              </div>
            )}

            {order.status === "awaiting_user_decision" && (
              <div className="order-card__actions">
                <button className="chat__send" onClick={() => act("resume")} disabled={busyAction !== null}>
                  {busyAction === "resume" ? "…" : "Resume (topped up)"}
                </button>
                <button className="chat__send chat__send--muted" onClick={() => act("cancel")} disabled={busyAction !== null}>
                  {busyAction === "cancel" ? "…" : "Cancel (fee not refunded)"}
                </button>
              </div>
            )}
          </div>
        )}

        {error && <p className="order-card__error">{error}</p>}
      </div>

      <div className="chat__input-row" style={{ flexDirection: "column", alignItems: "stretch", gap: 8 }}>
        <textarea
          className="chat__input"
          style={{ resize: "vertical", minHeight: 60 }}
          value={itemsText}
          placeholder={"amul milk 500ml\nbread"}
          onChange={(e) => setItemsText(e.target.value)}
          disabled={paying}
        />
        <button className="chat__send" onClick={payAndOrder} disabled={paying || !itemsText.trim()}>
          {paying ? "Paying…" : "Pay 1 HBAR & Order"}
        </button>
      </div>
    </div>
  );
}
