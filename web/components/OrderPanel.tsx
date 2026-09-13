"use client";

// The real order flow, browser-driven, in two steps:
//   1. Plan — a free-text request goes to the agent's Groq-backed planning step
//      (grounded in live restock data), which proposes a concrete shopping list.
//   2. Pay & order — the (editable) proposed list is what actually gets paid for.
// Payment itself happens server-side (see app/api/create-order/route.ts): the Ledger
// Key Ring decrypt and Hedera signing never touch the browser.

import { useEffect, useRef, useState } from "react";

interface ZeptoCartItem {
  name: string;
  quantity: number;
  price: string | null;
}

interface Order {
  id: string;
  status:
    | "payment_settled"
    | "checking_out"
    | "awaiting_user_decision"
    | "completed"
    | "canceled"
    | "failed";
  items: string[];
  x402: { transactionId: string; amountHbar: number; payer: string };
  zepto?: { items: ZeptoCartItem[]; total: string | null; orderId: string | null; purchaseLogTxHashes: string[] };
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}

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
  const [message, setMessage] = useState("");
  const [planning, setPlanning] = useState(false);
  const [itemsText, setItemsText] = useState("");
  const [reasoning, setReasoning] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<"resume" | "cancel" | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  function startPolling(orderId: string) {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const res = await fetch(`/api/orders/${orderId}`, { cache: "no-store" });
      if (!res.ok) return;
      const data: Order = await res.json();
      setOrder(data);
      if (data.status === "completed" || data.status === "canceled" || data.status === "failed") {
        if (pollRef.current) clearInterval(pollRef.current);
      }
    }, 3000);
  }

  async function plan() {
    if (!message.trim()) return;
    setPlanning(true);
    setError(null);
    setReasoning(null);

    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Planning failed.");
        return;
      }
      setItemsText(data.items.join("\n"));
      setReasoning(data.reasoning || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPlanning(false);
    }
  }

  async function payAndOrder() {
    const items = itemsText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (items.length === 0) return;

    setPaying(true);
    setError(null);
    setOrder(null);

    try {
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Payment failed.");
        return;
      }

      const statusRes = await fetch(`/api/orders/${data.orderId}`, { cache: "no-store" });
      setOrder(await statusRes.json());
      startPolling(data.orderId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPaying(false);
    }
  }

  async function act(action: "resume" | "cancel") {
    if (!order) return;
    setBusyAction(action);
    try {
      await fetch(`/api/orders/${order.id}/${action}`, { method: "POST" });
      startPolling(order.id);
    } finally {
      setBusyAction(null);
    }
  }

  function startOver() {
    setOrder(null);
    setItemsText("");
    setReasoning(null);
    setMessage("");
    setError(null);
  }

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
              <p className="order-card__mono">
                {order.x402.amountHbar} HBAR — tx {order.x402.transactionId}
              </p>
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
                  <p className="order-card__mono">
                    PurchaseLog: {order.zepto.purchaseLogTxHashes.length} tx(s) on Ethereum Sepolia
                  </p>
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
        <div className="chat__input-row" style={{ flexDirection: "column", alignItems: "stretch", gap: 8 }}>
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
            <div style={{ display: "flex", gap: 8 }}>
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
