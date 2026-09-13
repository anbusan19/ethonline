// Vault402 web — chat endpoint. PLACEHOLDER: the agent loop (src/agent/loop.ts)
// isn't wired to a model provider yet (Strands was dropped in favor of Groq per the
// final decision; the Groq key hasn't been provided). Returns an honest "not
// connected" reply rather than a fabricated agent response.
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    reply:
      "The agent backend isn't connected yet — this console is UI-only until src/agent/loop.ts is wired to a model provider.",
  });
}
