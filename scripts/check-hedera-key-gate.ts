// Verifies src/ledger/gate.ts's getHederaOperatorKey() end-to-end against the real
// ring — checks only length/prefix, never prints the actual key.
import { getHederaOperatorKey } from "../src/ledger/gate.js";

async function main(): Promise<void> {
  const key = await getHederaOperatorKey();
  console.log("PASS: decrypted a key via the Ledger Key Ring.");
  console.log(`Length: ${key.length} chars, prefix: ${key.slice(0, 4)}...`);
}

main().catch((err) => {
  console.error("FAIL:", err instanceof Error ? err.message : err);
  process.exit(1);
});
