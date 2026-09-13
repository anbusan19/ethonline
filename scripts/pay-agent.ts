// Buyer-side: pays the agent's x402-gated order endpoint (1 HBAR flat) and, on
// success, gets an orderId back. This IS the real payment — settles on Hedera
// testnet through Blocky402. The buyer's key comes from the Ledger Key Ring
// (src/ledger/gate.ts), never a raw env var.
//
// Usage: WALLET_PASS=$(security find-generic-password -a default -s ledger-wallet-cli -w) \
//   npx tsx scripts/pay-agent.ts "amul milk 500ml" "bread"

import { x402Client } from "@x402/core/client";
import { wrapFetchWithPayment } from "@x402/fetch";
import { ExactHederaScheme } from "@x402/hedera/exact/client";
// PrivateKey imported from @x402/hedera's own re-export, not our direct
// @hiero-ledger/sdk dependency — npm installed two copies of the SDK (ours, and one
// nested under @x402/hedera), and TS treats their PrivateKey classes as structurally
// distinct (private fields). createClientHederaSigner expects its own copy's type.
import { createClientHederaSigner, PrivateKey } from "@x402/hedera";
import { getHederaOperatorKey } from "../src/ledger/gate.js";
import { env } from "../src/config/env.js";

const ORDER_ENDPOINT = process.env.VAULT402_ORDER_URL ?? "http://localhost:4021/order";

async function main(): Promise<void> {
  const items = process.argv.slice(2);
  if (items.length === 0) {
    console.error('Usage: pay-agent.ts "item one" "item two" ...');
    process.exit(1);
  }

  console.log("Decrypting buyer key via the Ledger Key Ring...");
  const operatorKeyHex = await getHederaOperatorKey();
  const operatorId = env.hederaOperatorId();
  if (!operatorId) throw new Error("HEDERA_OPERATOR_ID is not set.");

  const privateKey = PrivateKey.fromStringECDSA(operatorKeyHex);
  const signer = createClientHederaSigner(operatorId, privateKey);

  // HBAR (0.0.0) isn't in @x402/hedera's default-asset table (USD-pegged tokens
  // only), so the client's spend guard rejects it unless explicitly allowlisted.
  // Capped at exactly the flat 1 HBAR fee rather than disabling spend controls
  // entirely (spendControls: false would allow any amount, any asset).
  const client = new x402Client()
    .register("hedera:testnet", new ExactHederaScheme(signer))
    .setSpendControls({
      allowedAssets: [{ network: "hedera:testnet", asset: "0.0.0", maxAmountPerPayment: "100000000" }],
    });
  const fetchWithPay = wrapFetchWithPayment(fetch, client);

  console.log(`Paying ${ORDER_ENDPOINT} (1 HBAR) for: ${items.join(", ")} ...`);
  const res = await fetchWithPay(ORDER_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ items }),
  });

  const body = await res.json();
  console.log(`HTTP ${res.status}:`, JSON.stringify(body, null, 2));

  if (res.status === 202) {
    console.log(`\nOrder created: ${body.orderId}`);
    console.log(`Check status:  curl ${ORDER_ENDPOINT.replace("/order", "")}/orders/${body.orderId}`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
