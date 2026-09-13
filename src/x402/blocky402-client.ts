// Vault402 — Blocky402 facilitator client. PLACEHOLDER.
//
// CLAUDE.md non-negotiables this module must respect once implemented:
// - Blocky402 accepts x402 protocol v2 ONLY. Use @x402/* v2 packages — v1 payloads
//   are rejected outright. (Exact package name/version TBD — verify against
//   Blocky402's docs before adding the dependency; do not guess a package name.)
// - The fee-payer account must be fetched live from GET /supported — never hardcoded.
// - Hedera's "exact" scheme is partially-signed: the buyer signs a TransferTransaction
//   with only their own signature, freezes it naming Blocky402's fee-payer, and the
//   facilitator adds its signature and submits.
// - Settlement asset is HBAR, asset id 0.0.0. Any other asset id is an HTS token id —
//   validate before using; do not assume 0.0.0 as a default without checking.
//
// TODO(Phase 2): build the payment-request/settle flow on top of getSupported() below.

import { env } from "../config/env.js";

export interface Blocky402SupportedKind {
  scheme: string;
  network: string;
  extra?: Record<string, unknown>;
}

export interface Blocky402SupportedResponse {
  kinds: Blocky402SupportedKind[];
  [key: string]: unknown;
}

/**
 * Fetches Blocky402's /supported payload. This is the ONLY sanctioned source for the
 * Hedera fee-payer account — never hardcode it elsewhere in this codebase.
 */
export async function getSupported(): Promise<Blocky402SupportedResponse> {
  const base = env.blocky402FacilitatorUrl();
  const url = new URL("/supported", base).toString();
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Blocky402 /supported returned ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as Blocky402SupportedResponse;
}
