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
  hederaOperatorKey: () => optional("HEDERA_OPERATOR_KEY"),
  blocky402FacilitatorUrl: () => required("BLOCKY402_FACILITATOR_URL"),
  subgraphStudioApiKey: () => required("SUBGRAPH_STUDIO_API_KEY"),
  subgraphQueryUrl: () => optional("SUBGRAPH_QUERY_URL"),
  // Intentionally NOT read as a plain string default — see CLAUDE.md: WALLET_PASS
  // must come from OS keychain command substitution, never a literal in .env.
  walletPass: () => optional("WALLET_PASS"),
};
