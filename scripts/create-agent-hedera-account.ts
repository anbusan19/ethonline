// One-off setup: creates a SEPARATE Hedera testnet account for the agent's x402
// resource server to receive payments into (payTo) — deliberately distinct from
// HEDERA_OPERATOR_ID (the buyer's account), so the settled transfer is between two
// real, distinct parties rather than a self-pay demo.
//
// Fully self-contained: generates a fresh ECDSA keypair in-process (never printed —
// only its length/prefix are ever logged), funds it via a real transfer from the
// buyer's account (auto-creating the account on first transfer to its EVM alias),
// then immediately encrypts the new private key via the Ledger Key Ring and deletes
// the plaintext. The key is never handled by the agent (me) directly — it exists only
// inside this script's process memory and the ring-encrypted file it produces.

import { writeFile, unlink } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { Client, PrivateKey, TransferTransaction, Hbar, AccountId } from "@hiero-ledger/sdk";
import { getHederaOperatorKey } from "../src/ledger/gate.js";
import { env } from "../src/config/env.js";

const run = promisify(execFile);
const FUND_AMOUNT_HBAR = 50;
const PLAINTEXT_PATH = "/tmp/agent-hedera-key.plaintext";
const ENC_PATH = "contracts/keys/agent-receiving.enc";
const RING_KEY_NAME = "vault402-agent-receiving";

async function main(): Promise<void> {
  const walletPass = env.walletPass();
  if (!walletPass) {
    throw new Error("WALLET_PASS is empty or unset — see .env.example.");
  }

  console.log("Decrypting buyer operator key via the Ledger Key Ring...");
  const operatorKeyHex = await getHederaOperatorKey();
  const operatorId = env.hederaOperatorId();
  if (!operatorId) throw new Error("HEDERA_OPERATOR_ID is not set.");

  const client = Client.forTestnet();
  client.setOperator(AccountId.fromString(operatorId), PrivateKey.fromStringECDSA(operatorKeyHex));

  console.log("Generating a fresh ECDSA keypair for the agent's receiving account...");
  const newKey = PrivateKey.generateECDSA();
  const evmAddress = newKey.publicKey.toEvmAddress();
  console.log(`New key generated (never printed). EVM alias: 0x${evmAddress}`);

  // Persist (encrypted) BEFORE any network step — losing the key after funding an
  // account with it strands those funds. This happened once already: a first run
  // threw on the accountId lookup below before the key was ever saved, losing the 50
  // test-HBAR sent to it. Harmless (free testnet HBAR) but wasteful — fixed by
  // reordering, not by silently retrying the same mistake.
  console.log("Encrypting the new private key via the Ledger Key Ring (before funding, deliberately)...");
  const keyHex = "0x" + newKey.toStringRaw();
  await writeFile(PLAINTEXT_PATH, keyHex + "\n", { mode: 0o600 });
  try {
    await run("wallet-cli", ["ring", "encrypt", "--key", RING_KEY_NAME, "-i", PLAINTEXT_PATH, "-o", ENC_PATH], {
      env: { ...process.env, WALLET_PASS: walletPass },
    });
  } finally {
    await unlink(PLAINTEXT_PATH).catch(() => {});
  }
  console.log(`Encrypted to ${ENC_PATH}. Plaintext deleted.`);

  console.log(`Funding it with ${FUND_AMOUNT_HBAR} HBAR from ${operatorId} (auto-creates the account)...`);
  const tx = await new TransferTransaction()
    .addHbarTransfer(AccountId.fromString(operatorId), new Hbar(-FUND_AMOUNT_HBAR))
    .addHbarTransfer(AccountId.fromEvmAddress(0, 0, evmAddress), new Hbar(FUND_AMOUNT_HBAR))
    .execute(client);

  const receipt = await tx.getReceipt(client);
  let newAccountId = receipt.accountId?.toString();

  if (!newAccountId) {
    console.log("Receipt didn't include accountId directly — looking it up via mirror node...");
    const res = await fetch(`https://testnet.mirrornode.hedera.com/api/v1/accounts/0x${evmAddress}`);
    if (res.ok) {
      const data = (await res.json()) as { account?: string };
      newAccountId = data.account;
    }
  }

  if (!newAccountId) {
    console.log(
      "\nCould not resolve the new account id automatically. The key IS safely encrypted " +
        `(${ENC_PATH}) and the transfer succeeded — look up 0x${evmAddress} on ` +
        "https://hashscan.io/testnet and set AGENT_HEDERA_ACCOUNT_ID manually."
    );
  } else {
    console.log(`Agent receiving account created: ${newAccountId}`);
    console.log("\nDone. Add to .env:");
    console.log(`AGENT_HEDERA_ACCOUNT_ID=${newAccountId}`);
  }

  client.close();
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
