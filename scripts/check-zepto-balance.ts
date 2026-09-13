// Read-only smoke test: confirm the real, already-logged-in Zepto session works and
// the wallet balance can be read. No spend, no cart changes.
import { checkWalletBalance } from "../src/checkout/check-wallet-balance.js";
import { closeSession } from "../src/checkout/session.js";

async function main(): Promise<void> {
  const result = await checkWalletBalance();
  console.log(JSON.stringify(result, null, 2));
  await closeSession();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
