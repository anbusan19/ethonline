// Two panes: the real order/payment flow on the left, a toggle between the live
// purchase knowledge graph and Agent Vision (ported from Agentry's VoiceStage/
// "Agentry Vision", retinted — see AgentVision.tsx) on the right. Both panes share
// OrderContext so Agent Vision reflects the same live order as the panel on the left.
// The chat pane is resizable — drag the divider; the width is remembered per browser.
"use client";

import { useEffect, useRef, useState } from "react";
import OrderPanel from "@/components/OrderPanel";
import KnowledgeGraph from "@/components/KnowledgeGraph";
import AgentVision from "@/components/AgentVision";
import { OrderProvider } from "@/lib/order-context";

const MIN_CHAT_WIDTH = 320; // matches .console__pane--chat's CSS min-width — keep in sync
const MAX_CHAT_WIDTH_RATIO = 0.55; // never let the chat pane eat more than 55% of the window
const STORAGE_KEY = "vault402.chatPanelWidth";

export default function ConsolePage() {
  const [view, setView] = useState<"graph" | "vision">("graph");
  // null = not yet resized by hand — falls back to the CSS default (25%).
  const [chatWidth, setChatWidth] = useState<number | null>(null);
  const containerRef = useRef<HTMLElement>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setChatWidth(Number(saved));
    } catch {
      // localStorage can throw (private browsing, blocked storage) — CSS default covers it
    }
  }, []);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!draggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const max = rect.width * MAX_CHAT_WIDTH_RATIO;
      const next = Math.min(max, Math.max(MIN_CHAT_WIDTH, e.clientX - rect.left));
      setChatWidth(next);
    }
    function onUp() {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      setChatWidth((w) => {
        if (w !== null) {
          try {
            localStorage.setItem(STORAGE_KEY, String(Math.round(w)));
          } catch {
            // per-viewer convenience only — fine if it doesn't persist
          }
        }
        return w;
      });
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  function startDrag() {
    draggingRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }

  return (
    <OrderProvider>
      <main className="console" ref={containerRef}>
        <div
          className="console__pane console__pane--chat"
          style={chatWidth !== null ? { flex: `0 0 ${chatWidth}px` } : undefined}
        >
          <OrderPanel />
        </div>

        <div
          className="console__resizer"
          onMouseDown={startDrag}
          onDoubleClick={() => {
            setChatWidth(null);
            try {
              localStorage.removeItem(STORAGE_KEY);
            } catch {
              // fine either way
            }
          }}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize chat panel (double-click to reset)"
        />

        <div className="console__pane console__pane--graph">
          <div className="view-toggle">
            <button
              className={`view-toggle__btn ${view === "graph" ? "view-toggle__btn--active" : ""}`}
              onClick={() => setView("graph")}
            >
              {view === "graph" ? "Purchase graph" : "Graph"}
            </button>
            <button
              className={`view-toggle__btn ${view === "vision" ? "view-toggle__btn--active" : ""}`}
              onClick={() => setView("vision")}
            >
              {view === "vision" ? "Agent vision" : "Vision"}
            </button>
          </div>
          {view === "graph" ? <KnowledgeGraph /> : <AgentVision />}
        </div>
      </main>
    </OrderProvider>
  );
}
