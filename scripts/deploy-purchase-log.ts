// Deploys PurchaseLog.sol to Ethereum Sepolia using a plain env-var key — explicitly
// NOT Ledger-gated, per the final design (Key Ring scope is the Hedera operator key
// only; see src/ledger/gate.ts and CLAUDE.md). Writes the deployed address + block
// number to contracts/deployment.sepolia.json and patches subgraph/subgraph.yaml's
// placeholder address/startBlock, so the subgraph can be deployed against real data
// right after.
//
// NOT YET RUN: needs ETHEREUM_SEPOLIA_PRIVATE_KEY + ETHEREUM_SEPOLIA_RPC_URL, which
// weren't available when this was written — run `npm run contracts:compile` first if
// contracts/artifacts/PurchaseLog.json is missing or stale.

import { readFile, writeFile } from "node:fs/promises";
import { ethers } from "ethers";
import { env } from "../src/config/env.js";

const ARTIFACT_PATH = "contracts/artifacts/PurchaseLog.json";
const DEPLOYMENT_PATH = "contracts/deployment.sepolia.json";
const SUBGRAPH_YAML_PATH = "subgraph/subgraph.yaml";

async function main(): Promise<void> {
  const artifact = JSON.parse(await readFile(ARTIFACT_PATH, "utf-8"));

  const provider = new ethers.JsonRpcProvider(env.ethereumSepoliaRpcUrl());
  const wallet = new ethers.Wallet(env.ethereumSepoliaPrivateKey(), provider);

  console.log(`Deploying PurchaseLog from ${wallet.address} ...`);
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  const contract = await factory.deploy();
  const deployTx = contract.deploymentTransaction();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const receipt = deployTx ? await deployTx.wait() : null;
  const startBlock = receipt?.blockNumber ?? (await provider.getBlockNumber());

  console.log(`PurchaseLog deployed at ${address} (block ${startBlock}).`);

  await writeFile(
    DEPLOYMENT_PATH,
    JSON.stringify({ network: "sepolia", address, startBlock, deployedAt: new Date().toISOString() }, null, 2)
  );
  console.log(`Wrote ${DEPLOYMENT_PATH}`);

  let yaml = await readFile(SUBGRAPH_YAML_PATH, "utf-8");
  yaml = yaml.replace(/address: ".*?" # TODO: fill in after deploy/, `address: "${address}"`);
  yaml = yaml.replace(/startBlock: 0 # TODO: fill in after deploy/, `startBlock: ${startBlock}`);
  await writeFile(SUBGRAPH_YAML_PATH, yaml);
  console.log(`Patched ${SUBGRAPH_YAML_PATH} with the real address/startBlock.`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
