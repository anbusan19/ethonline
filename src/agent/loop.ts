// Vault402 — autonomous purchase agent loop. PLACEHOLDER.
//
// Intended flow (see README.md "What it does" / "Payment flow in detail"):
//   decide -> propose (x402 request) -> Ledger gate approval -> Blocky402 settlement
//   on Hedera testnet -> PurchaseLog.recordPurchase -> subgraph indexes it ->
//   agent reasons over live subgraph data for restock/price-comparison suggestions.
//
// TODO(Phase 2): implement once the Phase 1 connectivity checks (scripts/check-*.ts)
// pass and the Ledger/Hedera signing question in src/ledger/gate.ts is resolved.

async function main(): Promise<void> {
  throw new Error("agent loop: not implemented — Phase 1 (smoke tests) is in progress");
}

main();
