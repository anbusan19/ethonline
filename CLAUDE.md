# CLAUDE.md — Vault402

Context file for Claude Code while building this project. Read this before generating or editing code in this repo.

## What we're building

An autonomous purchase agent for ETHOnline 2026. Three things must all be true in the final submission:

1. Every payment settles on **Hedera testnet** via **x402**, routed through the **Blocky402 facilitator**.
2. Every payment is gated by a **physical Ledger Nano approval** via the **Ledger Key Ring CLI** (`wallet-cli ring`) — no raw key or unscoped API credential ever lives in agent code.
3. Every completed purchase is logged on-chain and indexed by a **subgraph on Ethereum Sepolia**, and the agent's restock/price-comparison logic must genuinely reason over that live data — never mocked, never a raw dump.

Targeting three ETHGlobal sponsor tracks: Hedera (AI & Agentic Payments), Ledger (AI Agents x Ledger), The Graph (Best AI Use Case, **Start Fresh** pool). This is a net-new build for the event — do not reuse prior project-specific code as the core of the Graph submission; general architecture patterns from earlier agents are fine, a lifted prior deployment is not. Full qualification checklists live in `README.md` — keep code changes aligned with those checkboxes, don't silently drop a requirement to save time.

## Non-negotiable technical facts (do not deviate without flagging it)

**Blocky402 / Hedera**
- Blocky402 accepts **x402 protocol v2 only**. Use `@x402/*` v2 packages — v1 payloads are rejected outright.
- The fee-payer account **must be fetched live from Blocky402's `/supported` endpoint** — never hardcode it. Hedera's "exact" scheme is partially-signed: the buyer signs a `TransferTransaction` with only their own signature, freezes it naming Blocky402's fee-payer, and the facilitator adds its signature and submits.
- Settlement asset is **HBAR, asset id `0.0.0`**. Do not use the default Hedera testnet USDC token — it has no public faucet, so the agent can never actually hold it. Any asset id other than `0.0.0` is an HTS token id; validate before using.
- The Hedera operator key needs **explicit ECDSA parsing** — a common runtime-only failure if left implicit.
- Validate units before submitting a transaction — a dollar-denominated price must never be read as a literal HBAR amount.

**Ledger Key Ring / wallet-cli**
- `wallet-cli` is v2.1.0+, built on the Device Management Kit (DMK). Relevant commands: `account`, `balances`, `operations` (read-only, safe to call without touching the device) vs. `send`, `swap`, `ring` (write, require device confirmation).
- `WALLET_PASS` must be injected from the OS keychain via command substitution `$(...)` — **never a literal value**. A literal leaks to shell history, `ps`, CI logs, and any transcript this agent produces.
- An empty `WALLET_PASS` should abort, not silently skip authentication.
- `ring init` refuses to overwrite an existing keychain key if the session has no ring metadata — run `ring destroy` first if re-initializing.
- PBKDF2 is set to 600k iterations — don't reduce it "for speed" during testing.
- **Never use `--unsecure-no-password`** for anything touching real data, even during development.
- Read the official `ledger-wallet-cli` agent skill before generating any wallet-cli invocation.

**The Graph**
- Hedera and Arc are **not** on The Graph's officially supported network list — do not attempt to index Hedera settlement data directly via Subgraph Studio.
- `PurchaseLog` deploys to **Ethereum Sepolia** (network id `sepolia`), fully supported (Subgraphs, Substreams, Firehose) and decoupled from the Hedera settlement chain.
- Subgraph Studio requires a **live API key**; mocked, local-only, or static data disqualifies the submission for this track. Get the key early and verify a live query before building reasoning logic on top of it.
- "Meaningful work with the data" is a stated qualification requirement — a query that just prints results does not qualify. The restock/price-comparison logic must visibly reason (thresholds, comparisons, natural-language output), not just echo the query response.
- This submission goes in the **Start Fresh** pool, not Continuity. Don't introduce dependencies on any unfinished prior project — everything the Graph judges see should be buildable and explainable as work done during this event.

## Git hygiene

- Incremental commits throughout the build. No single giant commit on the final day — ETHGlobal's stated rule treats large single commits as unqualified by default.
- Commit as each qualification checkbox is actually satisfied, not in one batch at the end.

## Demo constraints to build toward

- Hedera + Ledger combined demo video: 5 minutes or less, must show a real transaction hash from an actual on-chain paid request — not simulated.
- Graph demo video: 2–4 minutes, must show the live query and the reasoning output, not just the raw GraphQL response.

## Coding conventions

- TypeScript throughout; reuse general x402 client patterns from prior work where genuinely reusable boilerplate (not project-specific deployments), but keep this project's own contracts, subgraph, and reasoning layer original to this build.
- Keep the `PurchaseLog` contract intentionally minimal — emit-and-forget. All reasoning belongs in the agent/subgraph layer, not on-chain, to keep testnet gas and complexity low.
- Any new environment variable goes in `.env.example` with a comment, never committed with a real value.

## When in doubt

If a change would violate one of the "non-negotiable technical facts" above to save time, stop and flag it rather than silently working around it — several of these exist specifically because past hackathon builds broke on exactly this shortcut.