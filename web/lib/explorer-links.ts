// Vault402 web — public explorer link helpers, so on-chain status is one click away
// instead of a raw id the user has to paste in manually.

/** Hedera transaction ids come back from settlement as "0.0.X@seconds.nanos" —
 * HashScan/mirror-node URLs want "0.0.X-seconds-nanos". */
export function hashScanTransactionUrl(transactionId: string): string {
  const normalized = transactionId.replace("@", "-").replace(".", "-");
  return `https://hashscan.io/testnet/transaction/${normalized}`;
}

export function hashScanAccountUrl(accountId: string): string {
  return `https://hashscan.io/testnet/account/${accountId}`;
}

export function sepoliaTxUrl(txHash: string): string {
  return `https://sepolia.etherscan.io/tx/${txHash}`;
}
