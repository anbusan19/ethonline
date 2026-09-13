// Phase 1 smoke test: hit Blocky402's /supported endpoint and confirm it returns a
// valid fee-payer for Hedera testnet. Pure connectivity check — no transaction built
// or signed here.

import { getSupported } from "../src/x402/blocky402-client.js";

async function main(): Promise<void> {
  console.log("Checking Blocky402 /supported ...");
  const supported = await getSupported();

  const hederaKinds = supported.kinds?.filter((k) => k.network?.toLowerCase().includes("hedera")) ?? [];
  if (hederaKinds.length === 0) {
    throw new Error(
      `No Hedera entries found in /supported response. Kinds seen: ${JSON.stringify(
        supported.kinds
      )}`
    );
  }

  const feePayers = hederaKinds
    .map((k) => k.extra?.feePayer ?? k.extra?.fee_payer)
    .filter((v): v is string => typeof v === "string" && v.length > 0);

  if (feePayers.length === 0) {
    throw new Error(
      `Hedera kind(s) found but no fee-payer field present. Raw kinds: ${JSON.stringify(
        hederaKinds
      )}`
    );
  }

  console.log("PASS: Blocky402 reachable, Hedera testnet supported.");
  console.log(`Fee-payer(s): ${feePayers.join(", ")}`);
}

main().catch((err) => {
  console.error("FAIL: Blocky402 /supported check failed.");
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
