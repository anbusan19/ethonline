// Compiles contracts/PurchaseLog.sol with solc and writes ABI + bytecode to
// contracts/artifacts/PurchaseLog.json. Deliberately not Hardhat/Foundry — the
// contract is one file, intentionally minimal (CLAUDE.md: emit-and-forget), so a
// direct solc invocation is simpler and more transparent than a full framework.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import solc from "solc";

const CONTRACT_PATH = "contracts/PurchaseLog.sol";
const OUT_DIR = "contracts/artifacts";
const OUT_PATH = path.join(OUT_DIR, "PurchaseLog.json");

async function main(): Promise<void> {
  const source = await readFile(CONTRACT_PATH, "utf-8");

  const input = {
    language: "Solidity",
    sources: { "PurchaseLog.sol": { content: source } },
    settings: {
      outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
      optimizer: { enabled: true, runs: 200 },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  const errors = (output.errors ?? []).filter((e: { severity: string }) => e.severity === "error");
  if (errors.length > 0) {
    for (const e of output.errors) console.error(e.formattedMessage ?? e.message);
    throw new Error(`solc reported ${errors.length} error(s) — see above.`);
  }
  for (const w of output.errors ?? []) console.warn(w.formattedMessage ?? w.message);

  const contract = output.contracts["PurchaseLog.sol"]["PurchaseLog"];
  const artifact = {
    contractName: "PurchaseLog",
    abi: contract.abi,
    bytecode: "0x" + contract.evm.bytecode.object,
  };

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(OUT_PATH, JSON.stringify(artifact, null, 2));
  console.log(`Compiled PurchaseLog.sol -> ${OUT_PATH}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
