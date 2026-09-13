import { fetchPurchaseHistory } from "../src/subgraph/client.js";
import { restockSuggestions } from "../src/reasoning/restock.js";
import { planShoppingList } from "../src/agent/plan.js";

async function main(): Promise<void> {
  const records = await fetchPurchaseHistory();
  const due = restockSuggestions(records);

  const message = process.argv.slice(2).join(" ") || "restock the pantry";
  console.log(`Planning for: "${message}"\n`);

  const plan = await planShoppingList(message, due);
  console.log("Items:", plan.items);
  console.log("Reasoning:", plan.reasoning);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
