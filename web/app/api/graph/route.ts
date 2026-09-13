// Vault402 web — serves the purchase-history graph view to components/KnowledgeGraph.tsx.
// See lib/reasoning/graph-view.ts for the data source/provenance note: real personal
// purchase history for now (data/purchases_graph.json, gitignored), migrating to the
// subgraph once PurchaseLog is deployed and backfilled (Phase 2).
import { NextResponse } from "next/server";
import { loadGraphView } from "@/lib/reasoning/graph-view";

export async function GET() {
  try {
    const graph = await loadGraphView();
    return NextResponse.json(graph);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load purchase graph" },
      { status: 500 }
    );
  }
}
