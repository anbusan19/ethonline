// Replays real historical purchases (data/purchases_graph.json — gitignored, never
// committed) as real PurchaseLog.recordPurchase transactions on Ethereum Sepolia, so
// the subgraph has genuine (not mocked) interval data to reason over from day one.
//
// Price/quantity gap (flagged, resolved by explicit user decision): the source data
// has no per-item price or quantity, so both are recorded as honest placeholders
// (quantity=1, price=0) rather than fabricated numbers presented as real.
//
// Timestamp: passed explicitly as each record's real historical purchase time (see
// contracts/PurchaseLog.sol's flagged deviation from block.timestamp) — this is the
// entire point of backfilling; using "now" for every entry would destroy the interval
// data restock reasoning depends on.
//
// NOT YET RUN: needs contracts/deployment.sepolia.json (from
// `npm run contracts:deploy`) and Sepolia credentials. Sequential, one tx per
// purchase record (~100+ real transactions) — run with --dry-run first to preview
// without sending anything.

import { readFile } from "node:fs/promises";
import { ethers } from "ethers";
import { env } from "../src/config/env.js";
import { loadLocalPurchaseHistory } from "../src/reasoning/local-graph.js";

const ARTIFACT_PATH = "contracts/artifacts/PurchaseLog.json";
const DEPLOYMENT_PATH = "contracts/deployment.sepolia.json";
const DATA_PATH = "data/purchases_graph.json";

const dryRun = process.argv.includes("--dry-run");

async function main(): Promise<void> {
  const records = await loadLocalPurchaseHistory(DATA_PATH);
  // Oldest first, so on-chain event order matches real purchase order.
  records.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  console.log(`Loaded ${records.length} historical purchase records.`);

  if (dryRun) {
    console.log("\n--dry-run: no transactions will be sent. First 5 records:");
    for (const r of records.slice(0, 5)) {
      console.log(`  recordPurchase("${r.item}", 1, 0, "${r.vendor}", ${Math.floor(r.timestamp.getTime() / 1000)})`);
    }
    console.log(`  ... and ${records.length - 5} more.`);
    return;
  }

  const artifact = JSON.parse(await readFile(ARTIFACT_PATH, "utf-8"));
  const deployment = JSON.parse(await readFile(DEPLOYMENT_PATH, "utf-8"));

  const provider = new ethers.JsonRpcProvider(env.ethereumSepoliaRpcUrl());
  const wallet = new ethers.Wallet(env.ethereumSepoliaPrivateKey(), provider);
  const contract = new ethers.Contract(deployment.address, artifact.abi, wallet);

  console.log(`Backfilling ${records.length} purchases to PurchaseLog at ${deployment.address} ...`);

  let ok = 0;
  for (const [i, r] of records.entries()) {
    const timestampSeconds = Math.floor(r.timestamp.getTime() / 1000);
    try {
      const tx = await contract.recordPurchase(r.item, 1, 0, r.vendor, timestampSeconds);
      await tx.wait();
      ok++;
      console.log(`[${i + 1}/${records.length}] ${r.item} (${r.timestamp.toISOString()}) -> ${tx.hash}`);
    } catch (err) {
      console.error(`[${i + 1}/${records.length}] FAILED for "${r.item}": ${err instanceof Error ? err.message : err}`);
    }
  }

  console.log(`\nDone: ${ok}/${records.length} purchases recorded on-chain.`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
