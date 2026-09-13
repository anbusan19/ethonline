// Vault402 — independent post-checkout verification.
//
// NEW this event (not ported from Agentry, which didn't have this step — its own
// checkout.py comment says the checkout path itself "was not exercised against a live
// cart during development"). Per the corrected flow: PurchaseLog must only be written
// after independently confirming the order really exists, not merely trusting
// checkout()'s own in-page redirect/text check — a false-positive there would log a
// grocery purchase to the subgraph that never actually happened.
//
// HONESTLY FLAGGED: the order-history selectors below are a best-effort guess at
// Zepto's account/orders page shape, not selectors verified against the live site
// (no one has confirmed this path works yet — same caveat Agentry's own checkout.py
// carries for the checkout button sequence). Verify this against a real order before
// trusting it to gate on-chain writes unattended.

import { STOREFRONT_URL, getPage } from "./session.js";

export interface VerifyOrderResult {
  verified: boolean;
  reason?: string;
}

export async function verifyOrderPlaced(orderId: string | null | undefined): Promise<VerifyOrderResult> {
  if (!orderId) {
    return { verified: false, reason: "No order id was extracted from checkout — nothing to verify against." };
  }

  const page = await getPage();
  try {
    await page.goto(`${STOREFRONT_URL}/account/orders`, { waitUntil: "domcontentloaded", timeout: 40000 });
    await page.waitForTimeout(1500);

    const bareId = orderId.replace(/^ZP-/, "");
    const found = await page.evaluate((needle: string) => document.body.innerText.includes(needle), bareId);

    if (!found) {
      return {
        verified: false,
        reason: `Order id ${orderId} not found on the order-history page — refusing to log an unverified purchase.`,
      };
    }

    return { verified: true };
  } catch (err) {
    return {
      verified: false,
      reason: `Could not reach the order-history page to verify: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
