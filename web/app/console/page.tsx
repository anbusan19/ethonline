// Two panes: the real order/payment flow on the left, the live purchase knowledge
// graph on the right. ChatPanel (a disconnected placeholder — no agent loop wired up
// yet) is replaced by OrderPanel, which drives the actual x402/Ledger/Hedera flow.
"use client";

import OrderPanel from "@/components/OrderPanel";
import KnowledgeGraph from "@/components/KnowledgeGraph";

export default function ConsolePage() {
  return (
    <main className="console">
      <div className="console__pane console__pane--chat">
        <OrderPanel />
      </div>
      <div className="console__pane console__pane--graph">
        <KnowledgeGraph />
      </div>
    </main>
  );
}
