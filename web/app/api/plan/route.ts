// Vault402 web — the agent's planning step, browser-facing. Turns a free-text
// request into a concrete shopping list, grounded in live restock data. See
// lib/agent/plan.ts and src/agent/plan.ts (root) for the full rationale.
import { NextResponse } from "next/server";
import { loadGraphView } from "@/lib/reasoning/graph-view";
import { planShoppingList } from "@/lib/agent/plan";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const message: unknown = body?.message;
  if (typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "Body must be { message: string }." }, { status: 400 });
  }

  try {
    const { nodes } = await loadGraphView();
    const due = nodes
      .filter((n) => n.overdue || n.due_soon)
      .map((n) => ({
        item: n.id,
        overdue: n.overdue,
        usualIntervalDays: n.usual_interval_days ?? 0,
        daysSinceLast: n.days_since_last,
      }));

    const plan = await planShoppingList(message, due);
    return NextResponse.json(plan);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 502 });
  }
}
