// Live, on-chain-sourced stats row — replaces AeroGuard's original StatsRow (fake
// "12 nations" placeholder copy) with real numbers pulled from the deployed subgraph.
// Server component: computed at request time from loadGraphView(), no client fetch.
import { loadGraphView } from "@/lib/reasoning/graph-view";

interface StatItemProps {
  value: string;
  label: string;
}

function StatItem({ value, label }: StatItemProps) {
  return (
    <div className="relative group p-4 border-l border-white/10 first:border-l-0 md:first:border-l">
      <div className="absolute top-0 left-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute bottom-0 left-0 w-3 h-px bg-blue-500" />
        <div className="absolute bottom-0 left-0 w-px h-3 bg-blue-500" />
        <div className="absolute bottom-0 right-0 w-3 h-px bg-blue-500" />
        <div className="absolute bottom-0 right-0 w-px h-3 bg-blue-500" />
      </div>
      <h3 className="text-xl md:text-2xl font-light text-white mb-1 tracking-tight group-hover:text-blue-400 transition-colors duration-300">
        {value}
      </h3>
      <p className="text-[10px] md:text-xs font-mono text-gray-500 uppercase tracking-wider leading-tight max-w-[140px]">
        {label}
      </p>
    </div>
  );
}

export default async function LiveStats() {
  let stats: { items: number; vendors: number; purchases: number; due: number } | null = null;

  try {
    const { nodes } = await loadGraphView();
    const vendors = new Set(nodes.flatMap((n) => n.platforms));
    stats = {
      items: nodes.length,
      vendors: vendors.size,
      purchases: nodes.reduce((sum, n) => sum + n.purchase_count, 0),
      due: nodes.filter((n) => n.overdue || n.due_soon).length,
    };
  } catch {
    // Subgraph unreachable — fail quiet rather than break the landing page.
    return null;
  }

  return (
    <div className="w-full grid grid-cols-2 md:grid-cols-4 border-t border-b border-white/10 bg-black/20 backdrop-blur-sm">
      <StatItem value={String(stats.items)} label="Items tracked, live from chain" />
      <StatItem value={String(stats.purchases)} label="Purchases indexed on Sepolia" />
      <StatItem value={String(stats.vendors)} label="Vendors seen in history" />
      <StatItem value={String(stats.due)} label="Due or overdue right now" />
    </div>
  );
}
