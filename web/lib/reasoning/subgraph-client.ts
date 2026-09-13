// Vault402 web — live subgraph client. Mirrors ../../../src/subgraph/client.ts
// (see that file's header) — duplicated because web/ is a separate Next.js package.
// TODO: factor into a shared workspace package if this drifts.

const PAGE_SIZE = 1000;

export interface SubgraphPurchase {
  item: string;
  vendor: string;
  timestampMs: number;
}

interface PurchaseQueryResult {
  data?: {
    purchases: { item: { name: string }; vendor: { name: string }; timestamp: string }[];
  };
  errors?: { message: string }[];
}

export async function fetchPurchaseHistory(): Promise<SubgraphPurchase[]> {
  const url = process.env.SUBGRAPH_QUERY_URL;
  if (!url) {
    throw new Error("SUBGRAPH_QUERY_URL is not set — see web/.env.example.");
  }

  const records: SubgraphPurchase[] = [];
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
      cache: "no-store",
    });

    if (!res.ok) throw new Error(`Subgraph query failed: ${res.status} ${res.statusText}`);

    const body = (await res.json()) as PurchaseQueryResult;
    if (body.errors) throw new Error(`Subgraph responded with errors: ${JSON.stringify(body.errors)}`);

    const page = body.data?.purchases ?? [];
    for (const p of page) {
      records.push({ item: p.item.name, vendor: p.vendor.name, timestampMs: Number(p.timestamp) * 1000 });
    }

    if (page.length < PAGE_SIZE) break;
    skip += PAGE_SIZE;
  }

  return records;
}
