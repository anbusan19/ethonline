"use client";

// The real order flow, browser-driven, in two steps:
//   1. Plan — a free-text request goes to the agent's Groq-backed planning step
//      (grounded in live restock data), which proposes a concrete shopping list.
//   2. Pay & order — the (editable) proposed list is what actually gets paid for.
// Payment itself happens server-side (see app/api/create-order/route.ts): the Ledger
// Key Ring decrypt and Hedera signing never touch the browser.
//
// Order/payment state lives in OrderContext (lib/order-context.tsx) — shared with
// AgentVision, the graph pane's alternate view, so both reflect the same live order.

import { useOrder, type Order } from "@/lib/order-context";
import { hashScanTransactionUrl, sepoliaTxUrl } from "@/lib/explorer-links";

const STATUS_LABEL: Record<Order["status"], string> = {
  payment_settled: "Payment settled — starting checkout",
  checking_out: "Checking out on Zepto…",
  awaiting_user_decision: "Needs your decision",
  completed: "Completed",
  canceled: "Canceled",
  failed: "Failed",
};

const STATUS_COLOR: Record<Order["status"], string> = {
  payment_settled: "text-blue-400 border-blue-500/40 bg-blue-500/10",
  checking_out: "text-blue-400 border-blue-500/40 bg-blue-500/10",
  awaiting_user_decision: "text-amber-400 border-amber-500/40 bg-amber-500/10",
  completed: "text-green-400 border-green-500/40 bg-green-500/10",
  canceled: "text-gray-400 border-gray-500/40 bg-gray-500/10",
  failed: "text-red-400 border-red-500/40 bg-red-500/10",
};

export default function OrderPanel() {
  const {
    message,
    setMessage,
    planning,
    itemsText,
    setItemsText,
    reasoning,
    paying,
    order,
    error,
    busyAction,
    plan,
    payAndOrder,
    act,
    startOver,
  } = useOrder();

  return (
    <div className="chat">
      <div className="chat__head">
        <span className="chat__brand">// VAULT402 — PLACE AN ORDER</span>
      </div>

      <div className="chat__scroll">
        {!order && !itemsText && (
          <div className="chat__empty">
            <p className="chat__greeting">What do you need?</p>
            <p className="chat__empty-sub">Say it in a sentence — the agent checks your real restock data too</p>
          </div>
        )}

        {!order && itemsText && (
          <div className="order-card">
            <span className="order-card__label">Agent's proposed list (edit freely before paying)</span>
            <textarea
              className="chat__input"
              style={{ resize: "vertical", minHeight: 100 }}
              value={itemsText}
              onChange={(e) => setItemsText(e.target.value)}
              disabled={paying}
            />
            {reasoning && <p className="order-card__mono">{reasoning}</p>}
          </div>
        )}

        {order && (
          <div className="order-card">
            <div className="order-card__row">
              <span className={`order-card__badge ${STATUS_COLOR[order.status]}`}>{STATUS_LABEL[order.status]}</span>
              <span className="order-card__id">#{order.id.slice(0, 8)}</span>
            </div>

            {/* Explicit, unambiguous confirmation line — this is what answers
                "is the transaction actually done" without reading the whole card. */}
            <p className={order.status === "completed" ? "order-card__confirm order-card__confirm--done" : "order-card__confirm"}>
              {order.status === "completed"
                ? "✓ Confirmed — service fee settled and product purchase verified on-chain."
                : order.status === "canceled" || order.status === "failed"
                  ? "✕ Not completed — see note below."
                  : "… In progress — the HBAR fee is already settled; watching checkout now."}
            </p>

            <div className="order-card__section">
              <span className="order-card__label">Requested</span>
              <ul className="order-card__list">
                {order.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="order-card__section">
              <span className="order-card__label">x402 service fee (Hedera testnet)</span>
              <p className="order-card__mono">{order.x402.amountHbar} HBAR</p>
              <a
                className="order-card__link"
                href={hashScanTransactionUrl(order.x402.transactionId)}
                target="_blank"
                rel="noopener noreferrer"
              >
                View transaction on HashScan ↗
              </a>
            </div>

            {order.zepto && (
              <div className="order-card__section">
                <span className="order-card__label">Zepto product purchase</span>
                <ul className="order-card__list">
                  {order.zepto.items.map((item, i) => (
                    <li key={i}>
                      {item.name} × {item.quantity} — {item.price}
                    </li>
                  ))}
                </ul>
                <p className="order-card__mono">
                  Total {order.zepto.total} — Zepto order {order.zepto.orderId}
                </p>
                {order.zepto.purchaseLogTxHashes.length > 0 && (
                  <div className="order-card__links">
                    <span className="order-card__label">PurchaseLog (Ethereum Sepolia)</span>
                    {order.zepto.purchaseLogTxHashes.map((hash, i) => (
                      <a
                        key={hash}
                        className="order-card__link"
                        href={sepoliaTxUrl(hash)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Item {i + 1} on Etherscan ↗
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

            {order.failureReason && (
              <div className="order-card__section">
                <span className="order-card__label">Note</span>
                <p className="order-card__error">{order.failureReason}</p>
              </div>
            )}

            {order.status === "awaiting_user_decision" && (
              <div className="order-card__actions">
                <button className="chat__send" onClick={() => act("resume")} disabled={busyAction !== null}>
                  {busyAction === "resume" ? "…" : "Resume (topped up)"}
                </button>
                <button className="chat__send chat__send--muted" onClick={() => act("cancel")} disabled={busyAction !== null}>
                  {busyAction === "cancel" ? "…" : "Cancel (fee not refunded)"}
                </button>
              </div>
            )}

            {(order.status === "completed" || order.status === "canceled" || order.status === "failed") && (
              <div className="order-card__actions">
                <button className="chat__send chat__send--muted" onClick={startOver}>
                  New order
                </button>
              </div>
            )}
          </div>
        )}

        {error && <p className="order-card__error">{error}</p>}
      </div>

      {!order && (
        <div className="chat__input-row">
          {!itemsText ? (
            <>
              <input
                className="chat__input"
                value={message}
                placeholder='e.g. "restock the pantry" or "I need milk and bread"'
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && plan()}
                disabled={planning}
              />
              <button className="chat__send" onClick={plan} disabled={planning || !message.trim()}>
                {planning ? "Planning…" : "Plan"}
              </button>
            </>
          ) : (
            <div className="chat__input-row-inner">
              <button className="chat__send chat__send--muted" onClick={startOver} disabled={paying}>
                Start over
              </button>
              <button className="chat__send" onClick={payAndOrder} disabled={paying || !itemsText.trim()}>
                {paying ? "Paying…" : "Pay 1 HBAR & Order"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
