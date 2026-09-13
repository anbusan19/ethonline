// One-off check: confirm the Ethereum Sepolia wallet has funds before deploying.
import { ethers } from "ethers";
import { env } from "../src/config/env.js";

async function main(): Promise<void> {
  const provider = new ethers.JsonRpcProvider(env.ethereumSepoliaRpcUrl());
  const wallet = new ethers.Wallet(env.ethereumSepoliaPrivateKey(), provider);
  const [balance, network] = await Promise.all([provider.getBalance(wallet.address), provider.getNetwork()]);

  console.log("Address:", wallet.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");
  console.log("Network:", network.name, network.chainId.toString());
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
