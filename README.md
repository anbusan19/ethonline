# Vault402

A Ledger-secured, Graph-powered autonomous purchase agent. It pays for goods and services over Hedera's x402 rails using a Hedera operator key that the Ledger Key Ring (`wallet-cli ring`) protects at rest, and reasons over its own on-chain purchase history — indexed by a subgraph — to suggest restocks and compare prices across vendors.

Built for **ETHOnline 2026**, targeting three sponsor tracks: **Hedera** (AI & Agentic Payments), **Ledger** (AI Agents x Ledger), and **The Graph** (Best AI Use Case, Start Fresh pool). This is a net-new build for the event: no code or deployment from any prior project is reused as the core of the Graph submission.

---

## What it does

1. **Decides** — the agent identifies a purchase to make (restock or new order).
2. **Unlocks** — it decrypts the Hedera operator key via the Ledger Key Ring (`wallet-cli ring decrypt`). The key is encrypted at rest and only ever exists in plaintext transiently, in-process; only this Ledger's Key Ring can decrypt it. This is a device-trustchain gate, not a live per-payment button press on the Nano — see [Ledger scope](#ledger-scope).
3. **Settles** — the decrypted key signs a Hedera `TransferTransaction`, routed through the **Blocky402** facilitator, and settled on **Hedera testnet** in HBAR.
4. **Logs** — a lightweight `PurchaseLog` contract emits an on-chain event: item, quantity, price, vendor, timestamp. This write is on **Ethereum Sepolia** and signs with a plain env-var key — out of Ledger's scope entirely (see below).
5. **Indexes** — a subgraph (deployed on **Ethereum Sepolia**) picks up these events live.
6. **Reasons** — the agent queries its own purchase history through the **Subgraph MCP** in natural language, computes consumption patterns, and surfaces restock suggestions and cross-vendor price comparisons.

```
 agent decides to buy
        |
        v
 Ledger Key Ring (wallet-cli ring decrypt) --- unlocks the Hedera operator key
        |
        v
 Blocky402 facilitator --- settles on Hedera testnet (HBAR)
        |
        v
 PurchaseLog contract emits event (Ethereum Sepolia, plain env-var key)
        |
        v
 Subgraph (Ethereum Sepolia) indexes Purchase / Item / Vendor
        |
        v
 Agent queries via Subgraph MCP --> restock suggestion + price comparison
```

### Ledger scope

The Ledger Key Ring's job is scoped to one thing: gating the Hedera operator key. `wallet-cli ring encrypt` puts that key at rest, keyed to this Ledger's LKRP trustchain; `wallet-cli ring decrypt` (called from `src/ledger/gate.ts`) is the only way to get it back, and doing so needs `WALLET_PASS` plus network access to LKRP — not a live device button press per payment. There is no Device Signer Kit / DMK native-signing code anywhere in this repo, and the `PurchaseLog` write on Ethereum Sepolia is intentionally outside Ledger's scope, signing with a plain env-var key instead.

---

## Track qualification mapping

### Hedera — AI & Agentic Payments on Hedera

- [ ] Live x402-gated service on Hedera testnet, settled through the Blocky402 facilitator
- [ ] Agent completes at least one real paid request end to end (see [Payment flow](#payment-flow-in-detail))
- [ ] Public repo with this README covering setup, architecture, and payment flow
- [ ] Demo video, five minutes or less, showing the paid request executing on-chain
- Stretch (extra points): on-chain agent identity via ERC-8004, HCS payment audit trail, per-call metering instead of a flat charge

### Ledger — AI Agents x Ledger ($3,500 pool)

Verbatim track requirement (ethglobal.com/events/ethonline2026/prizes, "AI Agents x Ledger"): *"Both must be built on the Ledger Agent Stack, and in particular on the Ledger Key Ring CLI (wallet-cli ring)"*, with example directions including *"Agents that pay for APIs, tools, or services with Ledger-secured payment flows, including x402-style patterns"* and *"Human-in-the-loop agents where Ledger approves high-risk actions before funds move or permissions escalate."*

Vault402 targets the **payment-flow** direction, not the **human-in-the-loop** one — see [Ledger scope](#ledger-scope) for why: the Key Ring gates the Hedera operator key at rest (this Ledger's trustchain), not a live per-payment device confirmation.

- [ ] Built fresh during the event on the Ledger Agent Stack, specifically the Ledger Key Ring CLI (`wallet-cli ring`) as the actual key backend for the Hedera operator key
- [ ] Agent pays for a service via a Ledger-secured, x402-style flow (Blocky402 on Hedera testnet)
- [ ] No Device Signer Kit / DMK native-signing code — Ledger's role stays scoped to `ring encrypt`/`ring decrypt`
- [ ] Public repo + demo video showing a live `wallet-cli ring decrypt` unlocking the operator key ahead of a real settlement

### The Graph — Best AI Use Case with The Graph (Start Fresh pool)

- [ ] The Graph is load-bearing: the agent uses the Subgraph MCP as its live data source for restock/price reasoning
- [ ] Live data only — the subgraph indexes real `PurchaseLog` events on Ethereum Sepolia, never mocked or static
- [ ] Meaningful reasoning over the data: consumption-rate analysis and restock suggestions, not a raw query dump
- [ ] Built fresh during the event — no prior project's contracts, subgraph, or deployment reused as the core of this submission
- [ ] Public repo + README/SKILL.md + demo video (two to four minutes)

---

## Payment flow in detail

1. Agent constructs a purchase intent (item, vendor, price in HBAR).
2. `src/ledger/gate.ts` calls `wallet-cli ring decrypt` to retrieve the Hedera operator key — this requires `WALLET_PASS` and this Ledger's LKRP trustchain; the key is used in-memory only and never written to disk unencrypted.
3. The decrypted key signs a Hedera `TransferTransaction`, frozen naming Blocky402's fee-payer (fetched live from Blocky402's `/supported` endpoint — never hardcoded), and submitted.
4. Settlement asset is HBAR (asset id `0.0.0`) — the default Hedera testnet USDC token has no public faucet, so it is not used.
5. On confirmation, `PurchaseLog.recordPurchase(...)` is called on Ethereum Sepolia, signed by a plain env-var key (no Ledger involvement), emitting the event the subgraph indexes.

## Restock & price-comparison flow in detail

1. `PurchaseLog` events are indexed by a subgraph deployed to Subgraph Studio under the `sepolia` network id.
2. Schema: `Purchase`, `Item`, `Vendor` entities; a shared `PriceQuote(vendor, item, price, timestamp)` shape if multiple vendor sources are wired in.
3. The agent queries the Subgraph MCP in natural language (e.g. "what has this user bought in the last 30 days, and what's overdue for restock").
4. Restock rule: flag an item when `daysSinceLastPurchase > averageInterval * 0.9`.

---

## Scope — Start Fresh

This submission goes in the Graph's Start Fresh pool: every piece — the `PurchaseLog` contract, its subgraph (schema + mapping), the Ledger Key Ring payment gate, the Blocky402/Hedera x402 settlement path, and the restock/price-comparison reasoning layer — is built new during ETHOnline 2026, with no prior deployment underneath it.

---

## Setup

Prerequisites:
- Ledger Nano, onboarded (PIN + seed set) — needed physically only once, for `wallet-cli ring init`. After that, `ring encrypt`/`ring decrypt` run without the device (LKRP-derived keys), so day-to-day agent runs don't need it plugged in.
- `wallet-cli` v2.1.0+ (`npx skills add ledgerhq/agent-skills` for the DMK build skill)
- Hedera testnet account funded with faucet HBAR
- Subgraph Studio account + API key
- Graph CLI (`npm install -g @graphprotocol/graph-cli@latest`)
- Node.js / TypeScript toolchain

Environment variables (`.env`, never committed — see `.env.example` for the full list with comments):
```
HEDERA_OPERATOR_ID=
HEDERA_OPERATOR_KEY_ENC_PATH=      # path to the ring-encrypted operator key, ECDSA
RING_KEY_NAME=                     # name used with ring encrypt/decrypt
BLOCKY402_FACILITATOR_URL=
ETHEREUM_SEPOLIA_PRIVATE_KEY=      # plain key for PurchaseLog writes — no Ledger involvement
ETHEREUM_SEPOLIA_RPC_URL=
SUBGRAPH_STUDIO_API_KEY=
SUBGRAPH_QUERY_URL=                # query via gateway-arbitrum.network.thegraph.com
WALLET_PASS=                       # inject via keychain at runtime, never a literal
```

Run:
```
npm install
npm run agent          # starts the purchase agent loop
npm run subgraph:deploy
```

---

## Demo videos

- Hedera + Ledger combined flow: [link]
- The Graph restock/price-comparison flow: [link]

## Tech stack

Hedera SDK, Blocky402 (x402 v2), Ledger Key Ring CLI (wallet-cli), The Graph (Subgraph Studio, Subgraph MCP), Ethereum Sepolia, TypeScript/Node.

## Team

[fill in]