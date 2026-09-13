// Runs the restock algorithm against the LIVE subgraph — the real data source now
// that PurchaseLog is deployed and backfilled. src/reasoning/local-graph.ts (the
// original data source for this script) is retained only as the one-time backfill
// migration input, not a runtime path.

import { fetchPurchaseHistory } from "../src/subgraph/client.js";
import { restockSuggestions } from "../src/reasoning/restock.js";

async function main(): Promise<void> {
  const records = await fetchPurchaseHistory();
  console.log(`Fetched ${records.length} purchase records from the subgraph.`);

  const due = restockSuggestions(records);
  console.log(`\n${due.length} item(s) due/overdue for restock:\n`);
  for (const d of due.slice(0, 15)) {
    const status = d.overdue ? "OVERDUE" : "due soon";
    console.log(
      `- ${d.item} [${status}] — usual interval ${d.usualIntervalDays}d, last bought ${d.daysSinceLast}d ago` +
        (d.oftenBoughtWith.length ? `; often with: ${d.oftenBoughtWith.join(", ")}` : "")
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
