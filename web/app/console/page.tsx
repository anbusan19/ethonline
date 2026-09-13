// Ported from Agentry's app/console/page.tsx: two panes, chat on the left, the
// purchase knowledge graph on the right. Voice mode / Voice Stage weren't ported
// (no voice channel exists in Vault402 yet) — just the chat + graph structure.
"use client";

import ChatPanel from "@/components/ChatPanel";
import KnowledgeGraph from "@/components/KnowledgeGraph";

export default function ConsolePage() {
  return (
    <main className="console">
      <div className="console__pane console__pane--chat">
        <ChatPanel />
      </div>
      <div className="console__pane console__pane--graph">
        <KnowledgeGraph />
      </div>
    </main>
  );
}
