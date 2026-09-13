// Vault402 web — purchase-history graph view, shaped for components/KnowledgeGraph.tsx.
//
// Data source: the LIVE subgraph (via subgraph-client.ts) — the real on-chain
// PurchaseLog history, not a local file. Co-purchase edges aren't a subgraph entity
// (the contract logs one item per event), so "bought in the same order" is
// reconstructed here by grouping purchases with an identical on-chain timestamp,
// same approach as src/reasoning/restock.ts's coPurchaseCounts (see that file for the
// reasoning: the backfill/live-purchase path preserves one timestamp per real order).
//
// Restock rule per README: due when daysSinceLastPurchase > averageInterval * 0.9,
// overdue when daysSinceLastPurchase > averageInterval.

import { fetchPurchaseHistory, type SubgraphPurchase } from "./subgraph-client";

export interface GraphViewNode {
  id: string;
  purchase_count: number;
  last_purchased: string | null;
  overdue: boolean;
  due_soon: boolean;
  platforms: string[];
}

export interface GraphViewLink {
  source: string;
  target: string;
  weight: number;
}

export interface GraphView {
  nodes: GraphViewNode[];
  links: GraphViewLink[];
}

function averageIntervalDays(timestampsMs: number[]): number | null {
  if (timestampsMs.length < 2) return null;
  const sorted = [...timestampsMs].sort((a, b) => a - b);
  const gaps = sorted.slice(1).map((t, i) => (t - sorted[i]) / 86_400_000);
  return gaps.reduce((a, b) => a + b, 0) / gaps.length;
}

function dominantPlatforms(vendors: string[]): string[] {
  const counts = new Map<string, number>();
  for (const v of vendors) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([v]) => v);
}

function coPurchaseLinks(records: SubgraphPurchase[]): GraphViewLink[] {
  const byTimestamp = new Map<number, Set<string>>();
  for (const r of records) {
    if (!byTimestamp.has(r.timestampMs)) byTimestamp.set(r.timestampMs, new Set());
    byTimestamp.get(r.timestampMs)!.add(r.item);
  }

  const weights = new Map<string, number>();
  for (const items of byTimestamp.values()) {
    const arr = [...items];
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        const key = [arr[i], arr[j]].sort().join("::");
        weights.set(key, (weights.get(key) ?? 0) + 1);
      }
    }
  }

  return [...weights.entries()].map(([key, weight]) => {
    const [source, target] = key.split("::");
    return { source, target, weight };
  });
}

export async function loadGraphView(dueThresholdRatio = 0.9, now: Date = new Date()): Promise<GraphView> {
  const records = await fetchPurchaseHistory();

  const byItem = new Map<string, SubgraphPurchase[]>();
  for (const r of records) {
    if (!byItem.has(r.item)) byItem.set(r.item, []);
    byItem.get(r.item)!.push(r);
  }

  const nodes: GraphViewNode[] = [...byItem.entries()].map(([item, purchases]) => {
    const timestampsMs = purchases.map((p) => p.timestampMs);
    const interval = averageIntervalDays(timestampsMs);
    const lastMs = Math.max(...timestampsMs);
    const daysSinceLast = (now.getTime() - lastMs) / 86_400_000;

    const dueSoon = interval !== null && daysSinceLast > interval * dueThresholdRatio;
    const overdue = interval !== null && daysSinceLast > interval;

    return {
      id: item,
      purchase_count: purchases.length,
      last_purchased: new Date(lastMs).toISOString(),
      overdue,
      due_soon: dueSoon && !overdue,
      platforms: dominantPlatforms(purchases.map((p) => p.vendor)),
    };
  });

  const links = coPurchaseLinks(records);

  return { nodes, links };
}
