// Vault402 web — purchase-history graph view, shaped for components/KnowledgeGraph.tsx.
//
// Mirrors the restock-interval math in ../../../src/reasoning/restock.ts (see that
// file's header for provenance/attribution) — duplicated here rather than imported
// because web/ is a separate Next.js package from the root TS project. TODO: factor
// into a shared workspace package if this drifts.
//
// Data source for now: the NetworkX node-link export at data/purchases_graph.json
// (gitignored, real personal purchase history) — a MIGRATION SOURCE, same as
// src/reasoning/local-graph.ts. Once PurchaseLog is deployed and backfilled, this
// should read from the subgraph instead (see src/subgraph/client.ts, Phase 2).
//
// Restock rule per README: due when daysSinceLastPurchase > averageInterval * 0.9,
// overdue when daysSinceLastPurchase > averageInterval.

import { readFile } from "node:fs/promises";
import path from "node:path";

interface NodeLinkPurchaseEntry {
  at?: string;
  platform?: string;
}
type NodeLinkPurchase = string | NodeLinkPurchaseEntry;

interface NodeLinkNode {
  id: string;
  purchases: NodeLinkPurchase[];
}

interface NodeLinkEdge {
  source: string;
  target: string;
  co_purchase: number;
}

interface NodeLinkGraph {
  nodes: NodeLinkNode[];
  edges: NodeLinkEdge[];
}

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

function timestampOf(p: NodeLinkPurchase): string {
  return typeof p === "string" ? p : p.at!;
}

function platformOf(p: NodeLinkPurchase): string {
  return typeof p === "string" ? "zepto" : p.platform ?? "zepto";
}

function averageIntervalDays(timestampsMs: number[]): number | null {
  if (timestampsMs.length < 2) return null;
  const sorted = [...timestampsMs].sort((a, b) => a - b);
  const gaps = sorted.slice(1).map((t, i) => (t - sorted[i]) / 86_400_000);
  return gaps.reduce((a, b) => a + b, 0) / gaps.length;
}

/** Every platform a node's purchases came from, most-frequent first — used to color
 * the node by its dominant storefront. */
function dominantPlatforms(purchases: NodeLinkPurchase[]): string[] {
  const counts = new Map<string, number>();
  for (const p of purchases) {
    const platform = platformOf(p);
    counts.set(platform, (counts.get(platform) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([platform]) => platform);
}

export async function loadGraphView(dueThresholdRatio = 0.9, now: Date = new Date()): Promise<GraphView> {
  const dataPath = path.resolve(process.cwd(), "..", "data", "purchases_graph.json");
  const raw = await readFile(dataPath, "utf-8");
  const graph: NodeLinkGraph = JSON.parse(raw);

  const nodes: GraphViewNode[] = graph.nodes.map((n) => {
    const timestampsMs = n.purchases.map((p) => new Date(timestampOf(p)).getTime());
    const interval = averageIntervalDays(timestampsMs);
    const lastMs = timestampsMs.length ? Math.max(...timestampsMs) : null;
    const daysSinceLast = lastMs !== null ? (now.getTime() - lastMs) / 86_400_000 : null;

    // README rule: due when daysSinceLastPurchase > averageInterval * 0.9.
    const dueSoon = interval !== null && daysSinceLast !== null && daysSinceLast > interval * dueThresholdRatio;
    const overdue = interval !== null && daysSinceLast !== null && daysSinceLast > interval;

    return {
      id: n.id,
      purchase_count: n.purchases.length,
      last_purchased: lastMs !== null ? new Date(lastMs).toISOString() : null,
      overdue,
      due_soon: dueSoon && !overdue,
      platforms: dominantPlatforms(n.purchases),
    };
  });

  const links: GraphViewLink[] = graph.edges.map((e) => ({
    source: e.source,
    target: e.target,
    weight: e.co_purchase,
  }));

  return { nodes, links };
}
