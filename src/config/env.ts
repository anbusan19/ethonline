// Vault402 — centralized env loading. Single place every script/module reads
// config from, so a missing var fails loudly and consistently instead of each
// call site doing its own process.env lookup.

import "dotenv/config";

function optional(name: string): string | undefined {
  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
}

function required(name: string): string {
  const value = optional(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name} (see .env.example)`);
  }
  return value;
}

export const env = {
  hederaOperatorId: () => optional("HEDERA_OPERATOR_ID"),
  // Hedera operator key is never a raw env var — it's encrypted at rest via the
  // Ledger Key Ring (see src/ledger/gate.ts). These two only locate/name that
  // encrypted material; the plaintext key never passes through this module.
  hederaOperatorKeyEncPath: () => required("HEDERA_OPERATOR_KEY_ENC_PATH"),
  ringKeyName: () => required("RING_KEY_NAME"),
  blocky402FacilitatorUrl: () => required("BLOCKY402_FACILITATOR_URL"),
  // PurchaseLog (Ethereum Sepolia) signer — explicitly NOT Ledger-gated per the final
  // design: Ledger's scope is the Hedera operator key only.
  ethereumSepoliaPrivateKey: () => required("ETHEREUM_SEPOLIA_PRIVATE_KEY"),
  ethereumSepoliaRpcUrl: () => required("ETHEREUM_SEPOLIA_RPC_URL"),
  subgraphStudioApiKey: () => required("SUBGRAPH_STUDIO_API_KEY"),
  subgraphQueryUrl: () => optional("SUBGRAPH_QUERY_URL"),
  // Intentionally NOT read as a plain string default — see CLAUDE.md: WALLET_PASS
  // must come from OS keychain command substitution, never a literal in .env.
  walletPass: () => optional("WALLET_PASS"),
};
