// Phase 1 smoke test: authenticate to Subgraph Studio's gateway with the API key and
// confirm we can reach it. No PurchaseLog subgraph exists yet (Start Fresh pool, net-new
// build) — this checks the key/gateway path against a public subgraph, not our own data.

import { env } from "../src/config/env.js";

// Public, well-known subgraph on The Graph's decentralized network — used purely to
// prove SUBGRAPH_STUDIO_API_KEY authenticates against the gateway. Swap for
// SUBGRAPH_QUERY_URL / the real PurchaseLog subgraph id once it's deployed.
const PROBE_SUBGRAPH_ID = "5zvR82QoaXYFyDEKLZ9t6v9adgnp9YfVjcxeCsz6y6R8"; // Uniswap V3, mainnet

function mask(key: string): string {
  return key.length <= 8 ? "****" : `${key.slice(0, 4)}...${key.slice(-4)}`;
}

async function main(): Promise<void> {
  const apiKey = env.subgraphStudioApiKey();
  const queryUrl =
    env.subgraphQueryUrl() ?? `https://gateway.thegraph.com/api/${apiKey}/subgraphs/id/${PROBE_SUBGRAPH_ID}`;

  console.log(`Checking Subgraph Studio gateway with key ${mask(apiKey)} ...`);

  const res = await fetch(queryUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query: "{ _meta { block { number } } }" }),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Gateway returned ${res.status} ${res.statusText}: ${text}`);
  }

  const body = JSON.parse(text);
  if (body.errors) {
    throw new Error(`Gateway responded with GraphQL errors: ${JSON.stringify(body.errors)}`);
  }

  const blockNumber = body.data?._meta?.block?.number;
  if (blockNumber === undefined) {
    throw new Error(`Unexpected response shape: ${text}`);
  }

  console.log("PASS: Subgraph Studio gateway reachable, API key authenticated.");
  console.log(`Probe subgraph indexed up to block ${blockNumber}.`);
}

main().catch((err) => {
  console.error("FAIL: Subgraph Studio connectivity check failed.");
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
