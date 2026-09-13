// Vault402 — Ledger Key Ring payment gate. PLACEHOLDER.
//
// IMPORTANT (flagged, not silently worked around): as of the wallet-cli-usage skill
// (.agents/skills/wallet-cli-usage/SKILL.md), wallet-cli's supported networks are
// bitcoin, ethereum, and solana — Hedera is not among them, and `ring` encrypt/decrypt
// is LKRP-backed encryption of arbitrary files/text, not a general transaction signer.
// The design in README.md ("wallet-cli ring broker ... requests device approval" for a
// Hedera TransferTransaction) needs a concrete answer for how physical Nano approval
// actually gates Hedera signing before Phase 2 payment-flow code is written here.
//
// CLAUDE.md non-negotiables this module must respect once that's resolved:
// - No raw key or unscoped API credential ever lives in agent code.
// - WALLET_PASS must be injected from the OS keychain via $(...) command substitution,
//   never a literal — and an empty value must abort, not silently skip auth.
// - Never use --unsecure-no-password for anything touching real data.
// - Read .agents/skills/wallet-cli-usage/SKILL.md before generating any wallet-cli
//   invocation from this module.
//
// TODO(Phase 2): implement once the Hedera-signing question above is resolved.

export interface PurchaseIntent {
  item: string;
  quantity: number;
  price: string; // decimal string, dollar-denominated at this layer — convert/validate before HBAR use
  vendor: string;
}

/**
 * Requests physical Ledger Nano approval for a purchase intent before anything signs.
 * NOT IMPLEMENTED — see module header.
 */
export async function requestApproval(_intent: PurchaseIntent): Promise<never> {
  throw new Error(
    "ledger/gate.requestApproval: not implemented — see src/ledger/gate.ts header for the " +
      "unresolved Hedera-signing question that must be answered before this is built."
  );
}
