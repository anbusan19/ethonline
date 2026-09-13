// Ported from Agentry's tools/checkout.py (real, worked-out selectors for the
// address/wallet-selection/place-order sequence). Same caveat Agentry's own comment
// carried: "the path from Click to Pay through wallet selection to a placed order was
// not exercised against a live cart during development — verify this against a real
// cart with a small order before trusting it unattended." That caveat still applies
// here; this is a faithful structural port, not a newly-verified path.
//
// This is the PRODUCT payment (Zepto Cash) — entirely separate from the x402/Hedera
// service fee the buyer already paid to unlock this call. Never conflate the two:
// see src/x402/vendor-server.ts for where that boundary is enforced.

import { STOREFRONT_URL, getPage, jsClick } from "./session.js";

export interface CheckoutResult {
  status: "paid" | "wallet_not_available" | "not_confirmed" | "error";
  amountPaid?: number | null;
  orderId?: string | null;
  note?: string;
  error?: string;
}

/**
 * Completes checkout for whatever is currently in the cart: schedules a delivery slot
 * if required, pays with Zepto Cash, and places the order. This spends real money.
 * Only call with confirm=true, and only right after a fresh view_cart/check_wallet_balance
 * confirms this exact order is what should be placed.
 */
export async function checkout(confirm = false): Promise<CheckoutResult> {
  if (!confirm) {
    return { status: "not_confirmed", note: "checkout requires confirm=true — nothing was done." };
  }

  const page = await getPage();
  try {
    await page.goto(`${STOREFRONT_URL}?cart=open`, { waitUntil: "domcontentloaded", timeout: 40000 });
    await page.waitForSelector("text=Bill Summary", { timeout: 10000 });

    await jsClick(page, "select delivery options|schedule delivery");
    await page.waitForTimeout(1500);
    if (await page.locator("text=Schedule your order").isVisible()) {
      await page
        .locator("button, div")
        .filter({ hasText: /^\d{1,2}\s*-\s*\d{1,2}\s*(AM|PM)$/ })
        .first()
        .click();
      await page.waitForTimeout(500);
      await jsClick(page, "^confirm$");
      await page.waitForTimeout(1500);
    }

    await jsClick(page, "click to pay|proceed to pay");
    await page.waitForTimeout(2000);

    const walletSelected = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input[type="radio"], input[type="checkbox"]'));
      for (const inp of inputs) {
        const label = inp.closest("label") ?? inp.parentElement;
        if (/zepto cash|zepto wallet|wallet balance/i.test(label?.textContent?.trim() ?? "")) {
          (inp as HTMLElement).click();
          return true;
        }
      }
      const el = Array.from(
        document.querySelectorAll('div, label, button, span, [role="radio"], [role="checkbox"]')
      ).find(
        (e) =>
          /zepto cash|zepto wallet|wallet balance/i.test(e.textContent?.trim() ?? "") &&
          (e as HTMLElement).offsetParent !== null
      );
      if (el) {
        (el as HTMLElement).click();
        return true;
      }
      return false;
    });
    await page.waitForTimeout(1000);

    if (!walletSelected) {
      return { status: "wallet_not_available", note: "No platform wallet option found — order was not placed." };
    }

    const placed = await jsClick(page, "place order|pay now|confirm order|pay ₹");
    if (!placed) {
      return { status: "error", error: "Could not find the Place Order / Pay Now button." };
    }

    await page.waitForTimeout(5000);

    const confirmation = await page.evaluate(() => {
      const idText = document.body.innerText.match(/#?([A-Z0-9]{6,20})/)?.[1];
      const total = document.querySelector('[class*="total" i], [class*="amount" i]');
      return { orderId: idText || null, total: total?.textContent?.trim().slice(0, 30) || null };
    });

    const currentUrl = page.url();
    const isConfirmed =
      currentUrl.includes("order") ||
      currentUrl.includes("success") ||
      currentUrl.includes("confirmed") ||
      (await page.locator("text=/order placed|order confirmed|on the way/i").isVisible());

    if (!isConfirmed) {
      return { status: "error", error: `Order placement may have failed. URL: ${currentUrl}` };
    }

    const match = /[\d.]+/.exec(confirmation.total ?? "");
    const amountPaid = match ? parseFloat(match[0]) : null;

    return {
      status: "paid",
      amountPaid,
      orderId: confirmation.orderId ? `ZP-${confirmation.orderId}` : null,
    };
  } catch (err) {
    return { status: "error", error: err instanceof Error ? err.message : String(err) };
  }
}
