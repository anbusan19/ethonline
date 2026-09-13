# Vault402

A Ledger-secured, Graph-powered autonomous purchase agent. It pays for goods and services over Hedera's x402 rails, gates every payment behind a physical Ledger Nano approval, and reasons over its own on-chain purchase history — indexed by a subgraph — to suggest restocks and compare prices across vendors.

Built for **ETHOnline 2026**, targeting three sponsor tracks: **Hedera** (AI & Agentic Payments), **Ledger** (AI Agents x Ledger), and **The Graph** (Best AI Use Case, Start Fresh pool). This is a net-new build for the event: no code or deployment from any prior project is reused as the core of the Graph submission.

---

## What it does

1. **Decides** — the agent identifies a purchase to make (restock or new order).
2. **Proposes** — it builds an x402 payment request and hands it to the Ledger Key Ring broker. No API key or private key ever touches the agent process.
3. **Approves** — a human physically approves the transaction on the Ledger Nano before anything signs.
4. **Settles** — the approved transaction is signed, routed through the **Blocky402** facilitator, and settled on **Hedera testnet** in HBAR.
5. **Logs** — a lightweight `PurchaseLog` contract emits an on-chain event: item, quantity, price, vendor, timestamp.
6. **Indexes** — a subgraph (deployed on **Ethereum Sepolia**) picks up these events live.
7. **Reasons** — the agent queries its own purchase history through the **Subgraph MCP** in natural language, computes consumption patterns, and surfaces restock suggestions and cross-vendor price comparisons.

```
 agent decides to buy
        |
        v
 Ledger Key Ring (wallet-cli ring) --- physical approval on Nano
        |
        v
 Blocky402 facilitator --- settles on Hedera testnet (HBAR)
        |
        v
 PurchaseLog contract emits event
        |
        v
 Subgraph (Ethereum Sepolia) indexes Purchase / Item / Vendor
        |
        v
 Agent queries via Subgraph MCP --> restock suggestion + price comparison
```

---

## Track qualification mapping

### Hedera — AI & Agentic Payments on Hedera

- [ ] Live x402-gated service on Hedera testnet, settled through the Blocky402 facilitator
- [ ] Agent completes at least one real paid request end to end (see [Payment flow](#payment-flow-in-detail))
- [ ] Public repo with this README covering setup, architecture, and payment flow
- [ ] Demo video, five minutes or less, showing the paid request executing on-chain
- Stretch (extra points): on-chain agent identity via ERC-8004, HCS payment audit trail, per-call metering instead of a flat charge

### Ledger — AI Agents x Ledger

- [ ] Built fresh during the event on the Ledger Agent Stack, specifically the Ledger Key Ring CLI (`wallet-cli ring`)
- [ ] Human-in-the-loop: Ledger approves the payment before funds move — nothing signs without physical device confirmation
- [ ] Agent pays for a service via a Ledger-secured, x402-style flow
- [ ] Public repo + demo video showing a live device approval

### The Graph — Best AI Use Case with The Graph (Start Fresh pool)

- [ ] The Graph is load-bearing: the agent uses the Subgraph MCP as its live data source for restock/price reasoning
- [ ] Live data only — the subgraph indexes real `PurchaseLog` events on Ethereum Sepolia, never mocked or static
- [ ] Meaningful reasoning over the data: consumption-rate analysis and restock suggestions, not a raw query dump
- [ ] Built fresh during the event — no prior project's contracts, subgraph, or deployment reused as the core of this submission
- [ ] Public repo + README/SKILL.md + demo video (two to four minutes)

---

## Payment flow in detail

1. Agent constructs a purchase intent (item, vendor, price in HBAR).
2. `wallet-cli ring` broker receives the intent and requests device approval — the raw signing key never leaves the Nano, and the agent never sees a private key or unscoped API credential.
3. On physical approval, the transaction is frozen with Blocky402's fee-payer (fetched live from Blocky402's `/supported` endpoint — never hardcoded) and submitted.
4. Settlement asset is HBAR (asset id `0.0.0`) — the default Hedera testnet USDC token has no public faucet, so it is not used.
5. On confirmation, `PurchaseLog.recordPurchase(...)` is called, emitting the event the subgraph indexes.

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
- Ledger Nano, paired and unlocked
- `wallet-cli` v2.1.0+ (`npx skills add ledgerhq/agent-skills` for the DMK build skill)
- Hedera testnet account funded with faucet HBAR
- Subgraph Studio account + API key
- Graph CLI (`npm install -g @graphprotocol/graph-cli@latest`)
- Node.js / TypeScript toolchain

Environment variables (`.env`, never committed):
```
HEDERA_OPERATOR_ID=
HEDERA_OPERATOR_KEY=        # ECDSA
BLOCKY402_FACILITATOR_URL=
SUBGRAPH_STUDIO_API_KEY=
WALLET_PASS=                # inject via keychain at runtime, never a literal
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