// Vault402 — thin client for writing to the deployed PurchaseLog contract on
// Ethereum Sepolia. Signs with a plain env-var key (src/config/env.ts:
// ethereumSepoliaPrivateKey) — explicitly NOT Ledger-gated, per the final design.
//
// price is in paise (1 INR = 100 paise) — see contracts/PurchaseLog.sol. Only ever
// called with REAL Zepto Cash product data after a verified checkout
// (src/orders/pipeline.ts) — never the x402/Hedera service fee.

import { readFile } from "node:fs/promises";
import { ethers } from "ethers";
import { env } from "../config/env.js";

const ARTIFACT_PATH = "contracts/artifacts/PurchaseLog.json";
const DEPLOYMENT_PATH = "contracts/deployment.sepolia.json";

let contractPromise: Promise<ethers.Contract> | null = null;

async function getContract(): Promise<ethers.Contract> {
  if (!contractPromise) {
    contractPromise = (async () => {
      const artifact = JSON.parse(await readFile(ARTIFACT_PATH, "utf-8"));
      const deployment = JSON.parse(await readFile(DEPLOYMENT_PATH, "utf-8"));
      const provider = new ethers.JsonRpcProvider(env.ethereumSepoliaRpcUrl());
      const wallet = new ethers.Wallet(env.ethereumSepoliaPrivateKey(), provider);
      return new ethers.Contract(deployment.address, artifact.abi, wallet);
    })();
  }
  return contractPromise;
}

export interface RealPurchase {
  item: string;
  quantity: number;
  pricePaise: number;
  vendor: string;
  /** Defaults to now — pass an explicit value only for backfill-style replay. */
  timestamp?: Date;
}

/** Records one real, verified purchase. Returns the transaction hash. */
export async function recordPurchase(p: RealPurchase): Promise<string> {
  const contract = await getContract();
  const timestampSeconds = Math.floor((p.timestamp ?? new Date()).getTime() / 1000);
  const tx = await contract.recordPurchase(p.item, p.quantity, p.pricePaise, p.vendor, timestampSeconds);
  await tx.wait();
  return tx.hash;
}
