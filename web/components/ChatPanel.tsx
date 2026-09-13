"use client";

// Structurally ported from Agentry's ChatPanel (greeting, message list, input row —
// see CLAUDE.md's Start Fresh note on reusing patterns, not deployments/code).
// Deliberately NOT wired to a live agent yet: Agentry's version talks to a running
// Strands backend; Vault402's agent loop (src/agent/loop.ts) isn't built yet (pending
// a model provider — Groq, per the final decision to skip Strands). Posting to
// /api/chat below gets an honest "not connected yet" reply rather than a fabricated
// one, so this UI never pretends to be more finished than it is.

import { useState } from "react";

interface Message {
  role: "user" | "agent";
  content: string;
  at: number;
}

function timeLabel(at: number) {
  return new Date(at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function greetingFor(hour: number): string {
  if (hour < 5) return "Midnight cravings?";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 22) return "Good evening";
  return "Late night restock?";
}

export default function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    const content = input.trim();
    if (!content || sending) return;

    setInput("");
    setMessages((m) => [...m, { role: "user", content, at: Date.now() }]);
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: content }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "agent", content: data.reply, at: Date.now() }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "agent", content: "Couldn't reach the agent — see /api/chat.", at: Date.now() },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="chat">
      <div className="chat__head">
        <span className="chat__brand">// VAULT402</span>
      </div>

      <div className="chat__scroll">
        {messages.length === 0 ? (
          <div className="chat__empty">
            <p className="chat__greeting">{greetingFor(new Date().getHours())}</p>
            <p className="chat__empty-sub">What do you need restocked?</p>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`chat__msg chat__msg--${m.role}`}>
              <div className="chat__bubble">{m.content}</div>
              <span className="chat__time">{timeLabel(m.at)}</span>
            </div>
          ))
        )}
      </div>

      <div className="chat__input-row">
        <input
          className="chat__input"
          value={input}
          placeholder="Ask Vault402 to restock something…"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          disabled={sending}
        />
        <button className="chat__send" onClick={send} disabled={sending}>
          {sending ? "…" : "Send"}
        </button>
      </div>
    </div>
  );
}
