// Vault402 — loader for a NetworkX node-link purchase-history export (the format
// Agentry's knowledge/graph.py writes to data/purchases_graph.json).
//
// This is a MIGRATION SOURCE, not a runtime data store: Vault402's live purchase
// history lives on-chain (PurchaseLog on Ethereum Sepolia) and is reasoned over via
// the subgraph (see src/subgraph/client.ts), never a local JSON file. This loader only
// exists to replay real historical purchases on-chain once
// (scripts/backfill-purchase-history.ts) and to smoke-test src/reasoning/restock.ts
// against real data before any of that infra exists.
//
// The source file is real personal purchase history — gitignored (data/), never
// committed, same as it was gitignored in the source project.

import { readFile } from "node:fs/promises";
import type { PurchaseRecord } from "./restock.js";

interface NodeLinkPurchaseEntry {
  at?: string; // new-format entries: {"at": iso, "platform": ...}
  platform?: string;
}
type NodeLinkPurchase = string | NodeLinkPurchaseEntry; // old-format entries are bare ISO strings

interface NodeLinkNode {
  id: string;
  purchases: NodeLinkPurchase[];
}

interface NodeLinkGraph {
  nodes: NodeLinkNode[];
  edges: { source: string; target: string; co_purchase: number }[];
}

function timestampOf(p: NodeLinkPurchase): string {
  return typeof p === "string" ? p : p.at!;
}

function platformOf(p: NodeLinkPurchase): string {
  // Entries predating platform tagging predate anything but Zepto — same default
  // Agentry's graph.py uses, for the same reason (honest default, not "unknown").
  return typeof p === "string" ? "zepto" : p.platform ?? "zepto";
}

/**
 * Loads a NetworkX node-link purchase graph and flattens it into PurchaseRecord[]
 * for src/reasoning/restock.ts (and for on-chain replay).
 */
export async function loadLocalPurchaseHistory(path: string): Promise<PurchaseRecord[]> {
  const raw = await readFile(path, "utf-8");
  const graph: NodeLinkGraph = JSON.parse(raw);

  const records: PurchaseRecord[] = [];
  for (const node of graph.nodes) {
    for (const purchase of node.purchases) {
      records.push({
        item: node.id,
        vendor: platformOf(purchase),
        timestamp: new Date(timestampOf(purchase)),
      });
    }
  }
  return records;
}
