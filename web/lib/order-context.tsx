"use client";

// Vault402 web — shared order/payment state, lifted out of OrderPanel so the console
// page's Agent Vision pane can show the same live order without a second polling loop
// or prop-drilling through the page.

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

export interface ZeptoCartItem {
  name: string;
  quantity: number;
  price: string | null;
}

export interface Order {
  id: string;
  status: "payment_settled" | "checking_out" | "awaiting_user_decision" | "completed" | "canceled" | "failed";
  items: string[];
  x402: { transactionId: string; amountHbar: number; payer: string };
  zepto?: { items: ZeptoCartItem[]; total: string | null; orderId: string | null; purchaseLogTxHashes: string[] };
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}

interface OrderContextValue {
  message: string;
  setMessage: (v: string) => void;
  planning: boolean;
  itemsText: string;
  setItemsText: (v: string) => void;
  reasoning: string | null;
  paying: boolean;
  order: Order | null;
  error: string | null;
  busyAction: "resume" | "cancel" | null;
  plan: () => Promise<void>;
  payAndOrder: () => Promise<void>;
  act: (action: "resume" | "cancel") => Promise<void>;
  startOver: () => void;
}

const OrderContext = createContext<OrderContextValue | null>(null);

export function OrderProvider({ children }: { children: ReactNode }) {
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
    <OrderContext.Provider
      value={{
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
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrder(): OrderContextValue {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error("useOrder must be used within an OrderProvider");
  return ctx;
}
