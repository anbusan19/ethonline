// Vault402 — Ledger Key Ring gate for the Hedera operator key.
//
// FINAL DESIGN (resolved, do not reopen without flagging it again): Ledger's role is
// scoped to gating the Hedera operator private key via `wallet-cli ring encrypt` /
// `ring decrypt` (LKRP-backed, at-rest encryption keyed to this Ledger's trustchain) —
// NOT native on-device transaction signing. There is no Device Signer Kit / DMK signing
// code in this repo, and none should be added here: wallet-cli's `send` networks are
// bitcoin/ethereum/solana only (see .agents/skills/wallet-cli-usage/SKILL.md) — Hedera
// isn't one of them, so a native on-device Hedera signer isn't available through
// wallet-cli regardless.
//
// The operator key is decrypted in-process (below), used to build+sign the Hedera
// TransferTransaction with @hiero-ledger/sdk in src/x402 (Phase 2), then discarded — the
// gate is that the key only exists decrypted at the moment it's used, and only this
// Ledger's ring can decrypt it, never that a physical button press happens per payment.
//
// The PurchaseLog write on Ethereum Sepolia is explicitly OUT of Ledger's scope — it
// signs with a plain env-var key (src/config/env.ts: ethereumSepoliaPrivateKey), no
// ring/device involvement, per the final design.
//
// CLAUDE.md non-negotiables this module respects:
// - No raw key ever lives in agent code at rest — only decrypted transiently in memory.
// - WALLET_PASS must be injected from the OS keychain via $(...), never a literal; an
//   empty value aborts rather than silently skipping the gate.
// - Decrypted output is sensitive (SKILL.md): never logged, printed, or written back to
//   disk — callers must use the returned key in-memory only.
// - Read .agents/skills/wallet-cli-usage/SKILL.md before generating any wallet-cli call.

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { env } from "../config/env.js";

const run = promisify(execFile);

/**
 * Decrypts the Hedera operator private key via the Ledger Key Ring
 * (`wallet-cli ring decrypt`). Requires:
 *  - WALLET_PASS set in the environment (from the OS keychain — see .env.example);
 *    empty/unset aborts rather than silently skipping the gate.
 *  - Network access — `ring decrypt` calls the LKRP backend to restore the trustchain
 *    on every invocation, even though no device touch is needed once the ring exists.
 *  - HEDERA_OPERATOR_KEY_ENC_PATH pointing at key material previously produced by
 *    `wallet-cli ring encrypt --key $RING_KEY_NAME -i <plaintext-key-file> -o <path>`.
 *
 * The returned key is sensitive: callers must keep it in-memory only (e.g. to build an
 * @hiero-ledger/sdk PrivateKey via explicit ECDSA parsing — see CLAUDE.md), never log it,
 * and never write it back to disk.
 *
 * Verified end-to-end (scripts/check-hedera-key-gate.ts) against a real ring on a
 * physical Nano S Plus: ring init, encrypt, and decrypt all succeed, and the decrypted
 * key's length/prefix match the original — checked without ever printing the full key.
 */
export async function getHederaOperatorKey(): Promise<string> {
  const walletPass = env.walletPass();
  if (!walletPass) {
    throw new Error(
      "WALLET_PASS is empty or unset — aborting rather than silently skipping the Ledger " +
        "Key Ring gate. Inject it via OS keychain command substitution (see .env.example)."
    );
  }

  const encPath = env.hederaOperatorKeyEncPath();
  const ringKeyName = env.ringKeyName();

  const { stdout } = await run("wallet-cli", ["ring", "decrypt", "--key", ringKeyName, "-i", encPath], {
    env: { ...process.env, WALLET_PASS: walletPass },
  });

  const key = stdout.trim();
  if (!key) {
    throw new Error("wallet-cli ring decrypt returned no output — refusing to proceed with an empty key.");
  }
  return key;
}
