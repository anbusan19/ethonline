// Vault402 — order checkout pipeline. NEW this event (not ported from Agentry, which
// had no x402 layer and no on-chain logging).
//
// Corrected flow (per explicit design decision): the x402/Hedera payment only
// AUTHORIZES the agent to shop — it is never logged as a purchase. Only the real
// Zepto Cash product purchase, independently verified, gets written to PurchaseLog.
// If the wallet balance is insufficient, the order pauses and the buyer is notified
// with next steps (resume after recharging, or cancel — the 1 HBAR service fee is
// NOT refunded on cancel; there is no reverse-x402 mechanism, so this is accepted as
// the cost of the agent having attempted the task).

import { checkWalletBalance } from "../checkout/check-wallet-balance.js";
import { searchProducts } from "../checkout/search-products.js";
import { addToCart } from "../checkout/add-to-cart.js";
import { viewCart } from "../checkout/view-cart.js";
import { checkout } from "../checkout/checkout.js";
import { verifyOrderPlaced } from "../checkout/verify-order.js";
import { notifyUser } from "../checkout/notify.js";
import { recordPurchase } from "../contracts/purchase-log-client.js";
import { getOrder, updateOrder, type Order, type MatchedProduct } from "./store.js";

function normalize(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Best-effort match: cart-drawer item names and search-result names come from two
 * different scrapes of the same site, so an exact match isn't guaranteed — fall back
 * to substring containment either direction. */
function findImageForCartItem(cartItemName: string, products: MatchedProduct[]): string | null {
  const target = normalize(cartItemName);
  for (const p of products) {
    if (!p.name) continue;
    const candidate = normalize(p.name);
    if (candidate === target || candidate.includes(target) || target.includes(candidate)) {
      return p.image;
    }
  }
  return null;
}

function rupeesToNumber(price: string | null | undefined): number | null {
  if (!price) return null;
  const match = /[\d,.]+/.exec(price);
  return match ? parseFloat(match[0].replace(/,/g, "")) : null;
}

function rupeesToPaise(price: string | null | undefined): number {
  const rupees = rupeesToNumber(price);
  return rupees === null ? 0 : Math.round(rupees * 100);
}

/**
 * Runs (or resumes) the checkout pipeline for an order that has already had its
 * x402/Hedera service fee settled. Safe to call multiple times — e.g. once from the
 * order-creation handler, again from POST /orders/:id/resume after the buyer tops up.
 */
export async function runCheckoutPipeline(orderId: string): Promise<void> {
  const order = await getOrder(orderId);
  if (!order) throw new Error(`Order ${orderId} not found.`);
  if (order.status === "completed" || order.status === "canceled") return;

  await updateOrder(orderId, { status: "checking_out" });

  // Search first (captures name/price/image — add-to-cart's own page scrape doesn't
  // carry an image), then add the exact matched URL rather than searching again
  // inside addToCart. Persisted as soon as we have it, well before checkout
  // completes, so the UI has real product cards to show while "checking out" or
  // "awaiting_user_decision" — not only after a fully completed order.
  const products: MatchedProduct[] = [];
  for (const item of order.items) {
    const found = await searchProducts(item, 1);
    const top = found.status === "ok" ? found.results[0] : null;
    products.push({
      requestedAs: item,
      name: top?.name ?? null,
      price: top?.price ?? null,
      image: top?.image ?? null,
      url: top?.url ?? null,
    });

    const added = top
      ? await addToCart({ productUrl: top.url })
      : await addToCart({ query: item });

    if (added.status !== "ok") {
      await notifyUser(
        `Order ${orderId}: couldn't add "${item}" to the cart (${added.error ?? "not found"}). ` +
          `Reply to cancel, or the order will retry on the next resume.`
      );
    }
  }
  await updateOrder(orderId, { products });

  const cart = await viewCart();
  if (cart.status !== "ok" || cart.items.length === 0) {
    await updateOrder(orderId, { status: "failed", failureReason: cart.error ?? "Cart is empty after adding items." });
    await notifyUser(`Order ${orderId}: failed — cart is empty or unreadable. Service fee was not refunded.`);
    return;
  }

  const balance = await checkWalletBalance();
  const cartTotal = rupeesToNumber(cart.total);

  if (balance.status !== "ok" || balance.balance === undefined || cartTotal === null) {
    await updateOrder(orderId, {
      status: "failed",
      failureReason: `Could not compare balance vs. cart total (balance: ${JSON.stringify(balance)}, total: ${cart.total}).`,
    });
    await notifyUser(`Order ${orderId}: failed — couldn't verify wallet balance against the cart total.`);
    return;
  }

  if (balance.balance < cartTotal) {
    await updateOrder(orderId, { status: "awaiting_user_decision" });
    await notifyUser(
      `Order ${orderId}: your Zepto Cash balance is ₹${balance.balance}, but the cart total is ${cart.total}. ` +
        `Options: (1) recharge Zepto Cash yourself, then tell the agent to resume this order, ` +
        `(2) pay another way outside the agent and mark this order manually, or ` +
        `(3) cancel — note the 1 HBAR service fee already paid is not refunded.`
    );
    return;
  }

  const result = await checkout(true);
  if (result.status !== "paid") {
    await updateOrder(orderId, { status: "failed", failureReason: result.error ?? result.note ?? result.status });
    await notifyUser(`Order ${orderId}: checkout failed (${result.status}). Service fee was not refunded.`);
    return;
  }

  const verification = await verifyOrderPlaced(result.orderId);
  if (!verification.verified) {
    await updateOrder(orderId, { status: "failed", failureReason: verification.reason });
    await notifyUser(
      `Order ${orderId}: checkout reported success but independent verification failed ` +
        `(${verification.reason}). Nothing was logged to PurchaseLog — check your Zepto account manually.`
    );
    return;
  }

  // Only now — verified real purchase — does anything reach PurchaseLog. One event
  // per cart item, in paise, vendor "zepto". Never the HBAR fee.
  const txHashes: string[] = [];
  for (const item of cart.items) {
    const hash = await recordPurchase({
      item: item.name,
      quantity: item.quantity,
      pricePaise: rupeesToPaise(item.price),
      vendor: "zepto",
    });
    txHashes.push(hash);
  }

  const zepto: Order["zepto"] = {
    items: cart.items.map((item) => ({ ...item, image: findImageForCartItem(item.name, products) })),
    total: cart.total ?? null,
    orderId: result.orderId ?? null,
    purchaseLogTxHashes: txHashes,
  };
  await updateOrder(orderId, { status: "completed", zepto });

  await notifyUser(
    `Order ${orderId} placed! ${cart.items.length} item(s), total ${cart.total} (Zepto order ${result.orderId}). ` +
      `Logged on-chain: ${txHashes.length} PurchaseLog transaction(s).`
  );
}
