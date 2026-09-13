// Vault402 web — public explorer link helpers, so on-chain status is one click away
// instead of a raw id the user has to paste in manually.

/** Hedera transaction ids come back from settlement as "0.0.X@seconds.nanos" —
 * HashScan/mirror-node URLs want "0.0.X-seconds-nanos" (account id's own dots
 * preserved — only the "@" and the seconds/nanos "." become "-"). A blind
 * `.replace(".", "-")` hits the FIRST dot it finds, which is inside "0.0.X", not
 * the seconds/nanos separator — splitting on "@" first avoids that entirely. */
export function hashScanTransactionUrl(transactionId: string): string {
  const [accountId, timestamp] = transactionId.split("@");
  const normalizedTimestamp = timestamp.replace(".", "-");
  return `https://hashscan.io/testnet/transaction/${accountId}-${normalizedTimestamp}`;
}

export function hashScanAccountUrl(accountId: string): string {
  return `https://hashscan.io/testnet/account/${accountId}`;
}

export function sepoliaTxUrl(txHash: string): string {
  return `https://sepolia.etherscan.io/tx/${txHash}`;
}
