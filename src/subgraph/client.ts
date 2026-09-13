// Vault402 — live subgraph client. This is now the real data source for restock
// reasoning (src/reasoning/restock.ts): src/reasoning/local-graph.ts remains only as
// the one-time backfill migration source (scripts/backfill-purchase-history.ts),
// never a runtime path.

import { env } from "../config/env.js";
import type { PurchaseRecord } from "../reasoning/restock.js";

const PAGE_SIZE = 1000;

interface PurchaseQueryResult {
  data?: {
    purchases: { item: { name: string }; vendor: { name: string }; timestamp: string }[];
  };
  errors?: { message: string }[];
}

/**
 * Fetches every Purchase entity from the deployed vault-402 subgraph, paginating past
 * PAGE_SIZE if needed, and returns them as PurchaseRecord[] ready for
 * src/reasoning/restock.ts.
 */
export async function fetchPurchaseHistory(): Promise<PurchaseRecord[]> {
  const url = env.subgraphQueryUrl();
  if (!url) {
    throw new Error("SUBGRAPH_QUERY_URL is not set — see .env.example.");
  }

  const records: PurchaseRecord[] = [];
  let skip = 0;

  for (;;) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        query: `{
          purchases(first: ${PAGE_SIZE}, skip: ${skip}, orderBy: timestamp) {
            item { name }
            vendor { name }
            timestamp
          }
        }`,
      }),
    });

    if (!res.ok) {
      throw new Error(`Subgraph query failed: ${res.status} ${res.statusText}`);
    }

    const body = (await res.json()) as PurchaseQueryResult;
    if (body.errors) {
      throw new Error(`Subgraph responded with errors: ${JSON.stringify(body.errors)}`);
    }

    const page = body.data?.purchases ?? [];
    for (const p of page) {
      records.push({
        item: p.item.name,
        vendor: p.vendor.name,
        timestamp: new Date(Number(p.timestamp) * 1000),
      });
    }

    if (page.length < PAGE_SIZE) break;
    skip += PAGE_SIZE;
  }

  return records;
}
