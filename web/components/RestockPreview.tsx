// Shows the restock algorithm's actual output against the live subgraph, right on
// the landing page — proof the reasoning is real, not asserted. Server component.
import { loadGraphView } from "@/lib/reasoning/graph-view";

function daysAgo(iso: string | null): string {
  if (!iso) return "—";
  const days = (Date.now() - new Date(iso).getTime()) / 86_400_000;
  return `${Math.round(days)}d ago`;
}

export default async function RestockPreview() {
  let due: Awaited<ReturnType<typeof loadGraphView>>["nodes"] = [];

  try {
    const { nodes } = await loadGraphView();
    due = nodes
      .filter((n) => n.overdue || n.due_soon)
      .sort((a, b) => Number(b.overdue) - Number(a.overdue))
      .slice(0, 5);
  } catch {
    return null;
  }

  if (due.length === 0) return null;

  return (
    <div className="border border-white/10 bg-black/30 divide-y divide-white/10">
      {due.map((item) => (
        <div key={item.id} className="flex items-center justify-between gap-4 px-5 py-4">
          <div className="min-w-0">
            <p className="text-sm text-white truncate">{item.id}</p>
            <p className="text-xs text-gray-500 font-mono mt-1">
              bought {item.purchase_count}× · last {daysAgo(item.last_purchased)}
            </p>
          </div>
          <span
            className={`shrink-0 font-mono text-[10px] uppercase tracking-wider px-2 py-1 rounded-sm border ${
              item.overdue
                ? "text-red-400 border-red-500/40 bg-red-500/10"
                : "text-blue-400 border-blue-500/40 bg-blue-500/10"
            }`}
          >
            {item.overdue ? "Overdue" : "Due soon"}
          </span>
        </div>
      ))}
    </div>
  );
}
