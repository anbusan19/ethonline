// Vault402 web — mirrors ../../../src/agent/plan.ts (see that file's header for the
// full rationale and the prompt-bug fix). Duplicated because web/ is a separate
// Next.js package. TODO: factor into a shared workspace package if this drifts.

const GROQ_MODEL = "openai/gpt-oss-120b";
const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

export interface RestockLine {
  item: string;
  overdue: boolean;
  usualIntervalDays: number;
  daysSinceLast: number;
}

export interface ShoppingPlan {
  items: string[];
  reasoning: string;
}

function buildSystemPrompt(due: RestockLine[]): string {
  const restockLines =
    due.length === 0
      ? "Nothing is currently flagged as due or overdue."
      : due
          .map(
            (d) =>
              `- ${d.item}: ${d.overdue ? "OVERDUE" : "due soon"}, usually bought every ${d.usualIntervalDays}d, last bought ${d.daysSinceLast}d ago`
          )
          .join("\n");

  return `You are Vault402's shopping planning agent. Given a user's request and their real restock status (below, computed from their actual on-chain purchase history), decide the concrete shopping list to order.

Restock status (from the live subgraph):
${restockLines}

Rules:
- Always include what the user explicitly asked for, exactly as they'd expect — restock data never overrides or filters out an explicit request, even if that item isn't in the restock list at all.
- The restock data is for ADDING to a vague request ("restock the pantry" has nothing explicit, so use it fully) or ROUNDING OUT a specific one (they asked for milk; bread is also overdue and often bought with it — worth adding). Never use it to justify dropping something they actually asked for.
- Keep item names short and searchable (e.g. "amul milk 500ml", not "some milk please").
- Respond ONLY with JSON: {"items": ["...", "..."], "reasoning": "one or two sentences explaining the list"}.`;
}

export async function planShoppingList(userMessage: string, due: RestockLine[]): Promise<ShoppingPlan> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set — see web/.env.example.");

  const res = await fetch(GROQ_ENDPOINT, {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: buildSystemPrompt(due) },
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) throw new Error(`Groq request failed: ${res.status} ${res.statusText}`);

  const body = await res.json();
  const content = body.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq response had no content.");

  const parsed = JSON.parse(content);
  const items = Array.isArray(parsed.items) ? parsed.items.filter((i: unknown) => typeof i === "string") : [];
  if (items.length === 0) throw new Error(`Groq returned no items. Raw: ${content}`);

  return { items, reasoning: typeof parsed.reasoning === "string" ? parsed.reasoning : "" };
}
