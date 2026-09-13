// Vault402 — cart clearing tool.
//
// The pipeline shares one persistent Playwright session across all orders (see
// session.ts). Items from previous runs — including past orders that paused on
// insufficient balance — accumulate in the live Zepto cart. This must be cleared
// before adding items for a new order so we don't carry forward stale items.
//
// Strategy: open the cart drawer, then repeatedly click "Decrease quantity by one"
// on every visible item until the cart is empty. This mimics what a human would do
// and works regardless of how many items are there.

import { STOREFRONT_URL, getPage } from "./session.js";

export interface ClearCartResult {
  status: "ok" | "error";
  removedCount: number;
  error?: string;
}

export async function clearCart(): Promise<ClearCartResult> {
  const page = await getPage();
  try {
    await page.goto(`${STOREFRONT_URL}?cart=open`, { waitUntil: "domcontentloaded", timeout: 40000 });

    // If no "Bill Summary" appears within 5s the cart is already empty — done.
    try {
      await page.waitForSelector("text=Bill Summary", { timeout: 5000 });
    } catch {
      return { status: "ok", removedCount: 0 };
    }

    let removedCount = 0;
    const MAX_ITERATIONS = 200; // safety limit — 200 clicks max

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      // Find ALL visible "Decrease quantity" buttons and click the first one.
      // Zepto uses aria-label "Decrease quantity by one" on the − stepper.
      const decreaseBtn = page.getByRole("button", { name: "Decrease quantity by one" }).first();
      const isVisible = await decreaseBtn.isVisible().catch(() => false);

      if (!isVisible) {
        // No more decrease buttons — either cart is empty or drawer closed.
        break;
      }

      await decreaseBtn.click();
      await page.waitForTimeout(400); // let the quantity update animate
      removedCount++;
    }

    // Verify the cart is now empty — "Bill Summary" should be gone.
    await page.waitForTimeout(800);
    const billStillVisible = await page.locator("text=Bill Summary").isVisible().catch(() => false);

    if (billStillVisible) {
      // There are still items — hit the safety limit or something didn't remove.
      return {
        status: "error",
        removedCount,
        error: `Cart may not be fully empty after ${removedCount} removals — Bill Summary still visible.`,
      };
    }

    return { status: "ok", removedCount };
  } catch (err) {
    return { status: "error", removedCount: 0, error: err instanceof Error ? err.message : String(err) };
  }
}
