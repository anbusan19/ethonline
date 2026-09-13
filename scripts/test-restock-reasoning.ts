// Smoke test: run the ported restock algorithm against real local purchase history
// (data/purchases_graph.json — gitignored, never committed) to confirm the port
// behaves sensibly before any on-chain/subgraph infra exists.

import { loadLocalPurchaseHistory } from "../src/reasoning/local-graph.js";
import { restockSuggestions } from "../src/reasoning/restock.js";

async function main(): Promise<void> {
  const records = await loadLocalPurchaseHistory("data/purchases_graph.json");
  console.log(`Loaded ${records.length} purchase records.`);

  const due = restockSuggestions(records, 3);
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
