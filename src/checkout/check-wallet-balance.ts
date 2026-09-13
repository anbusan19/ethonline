// Ported from Agentry's tools/check_wallet_balance.py (general pattern + the real,
// already-worked-out selectors — see CLAUDE.md's Start Fresh note). Reads the
// storefront's platform wallet balance (Zepto Cash) directly from the account page.
import { STOREFRONT_URL, getPage } from "./session.js";

const BALANCE_RE = /available balance:\s*₹\s?([\d,]+(?:\.\d+)?)/i;

export interface WalletBalanceResult {
  status: "ok" | "error";
  wallet?: string;
  balance?: number;
  error?: string;
}

export async function checkWalletBalance(): Promise<WalletBalanceResult> {
  const page = await getPage();
  try {
    await page.goto(`${STOREFRONT_URL}/account`, { waitUntil: "domcontentloaded", timeout: 40000 });
    await page.waitForSelector("text=Available Balance", { timeout: 10000 });

    const body = await page.evaluate(() => document.body.innerText);
    const match = BALANCE_RE.exec(body);
    if (!match) {
      return { status: "error", error: "Could not find a balance on the account page." };
    }

    const walletLine =
      body.split("\n").find((l) => /cash|gift card/i.test(l)) ?? "Zepto Cash";

    return { status: "ok", wallet: walletLine.trim(), balance: parseFloat(match[1].replace(/,/g, "")) };
  } catch (err) {
    return { status: "error", error: err instanceof Error ? err.message : String(err) };
  }
}
