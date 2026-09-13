// Phase 1 smoke test: confirm wallet-cli and a paired Ledger Nano talk to each other.
// Read-only only — genuine-check (device authenticity) and balances (an already
// session-discovered account). No signing, no funds touched.
//
// Per .agents/skills/wallet-cli-usage/SKILL.md: genuine-check and account discover
// need dangerouslyDisableSandbox at the tool-call layer (USB access) — this script
// just shells out to the already-installed wallet-cli binary, so that bypass is the
// caller's concern, not this script's.
//
// Preconditions (see the skill): device unlocked, onboarded (PIN + seed already set —
// a factory-fresh "Set up as new device" screen fails with a raw device error), and
// on the dashboard (no app open) for genuine-check. `balances` needs an account label
// already in the session — run `wallet-cli account discover ethereum` first if
// `accountLabel` below isn't in session yet.

import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);

// Hedera isn't a wallet-cli network (bitcoin/ethereum/solana only — see
// src/ledger/gate.ts) — this checks the device/CLI path in general, not a
// Hedera-specific account.
const accountLabel = process.argv[2] ?? "ethereum-1";

async function main(): Promise<void> {
  console.log("Running wallet-cli genuine-check ...");
  const genuine = await run("wallet-cli", ["genuine-check"]);
  console.log(genuine.stdout.trim());

  console.log(`\nRunning wallet-cli balances ${accountLabel} ...`);
  const balances = await run("wallet-cli", ["balances", accountLabel]);
  console.log(balances.stdout.trim());

  console.log("\nPASS: wallet-cli reaches the device (genuine-check ok, balances read).");
}

main().catch((err) => {
  console.error("FAIL: Ledger connectivity check failed.");
  const stderr = err?.stderr?.trim();
  console.error(stderr || (err instanceof Error ? err.message : err));
  process.exit(1);
});
