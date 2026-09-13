// Two panes: the real order/payment flow on the left, a toggle between the live
// purchase knowledge graph and Agent Vision (ported from Agentry's VoiceStage/
// "Agentry Vision", retinted — see AgentVision.tsx) on the right. Both panes share
// OrderContext so Agent Vision reflects the same live order as the panel on the left.
"use client";

import { useState } from "react";
import OrderPanel from "@/components/OrderPanel";
import KnowledgeGraph from "@/components/KnowledgeGraph";
import AgentVision from "@/components/AgentVision";
import { OrderProvider } from "@/lib/order-context";

export default function ConsolePage() {
  const [view, setView] = useState<"graph" | "vision">("graph");

  return (
    <OrderProvider>
      <main className="console">
        <div className="console__pane console__pane--chat">
          <OrderPanel />
        </div>
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
