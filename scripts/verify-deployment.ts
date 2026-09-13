// One-off check: confirm real bytecode exists at the deployed PurchaseLog address.
import { ethers } from "ethers";
import { readFile } from "node:fs/promises";
import { env } from "../src/config/env.js";

async function main(): Promise<void> {
  const deployment = JSON.parse(await readFile("contracts/deployment.sepolia.json", "utf-8"));
  const provider = new ethers.JsonRpcProvider(env.ethereumSepoliaRpcUrl());
  const code = await provider.getCode(deployment.address);
  console.log("Address:", deployment.address);
  console.log("Bytecode length:", code.length, code === "0x" ? "(EMPTY — not deployed!)" : "(contract present)");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
