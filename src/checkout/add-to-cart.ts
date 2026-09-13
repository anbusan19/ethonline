// Ported from Agentry's tools/add_to_cart.py — the real, worked-out selectors
// (plain "Add to Cart" button, then a "− N +" quantity stepper) against the live
// storefront.
import { STOREFRONT_URL, getPage } from "./session.js";

export interface AddToCartResult {
  status: "ok" | "not_found" | "error";
  name?: string | null;
  price?: string | null;
  added?: number;
  note?: string | null;
  error?: string;
}

const NAME_PRICE_RE = /([^\n]+)\n\nNet quantity[^\n]*\n\n₹\s*\n?\s*([\d,.]+)/;

async function readProductDetails(page: Awaited<ReturnType<typeof getPage>>) {
  const body = await page.evaluate(() => document.body.innerText);
  const match = NAME_PRICE_RE.exec(body);
  if (!match) return { name: null, price: null };
  return { name: match[1].trim(), price: `₹${match[2]}` };
}

export async function addToCart(
  { productUrl = "", query = "", quantity = 1 }: { productUrl?: string; query?: string; quantity?: number }
): Promise<AddToCartResult> {
  if (!productUrl && !query) {
    return { status: "error", error: "Provide either productUrl or query." };
  }

  const page = await getPage();
  try {
    let fullUrl: string;
    if (productUrl) {
      fullUrl = productUrl.startsWith("http") ? productUrl : `${STOREFRONT_URL}${productUrl}`;
    } else {
      await page.goto(`${STOREFRONT_URL}/search?query=${encodeURIComponent(query)}`, {
        waitUntil: "domcontentloaded",
        timeout: 40000,
      });
      await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });
      const href = await page.evaluate(
        () => document.querySelector('[data-testid="product-card"]')?.getAttribute("href") ?? null
      );
      if (!href) return { status: "not_found", error: `No products found for "${query}"` };
      fullUrl = `${STOREFRONT_URL}${href}`;
    }

    await page.goto(fullUrl, { waitUntil: "domcontentloaded", timeout: 40000 });
    await page.waitForTimeout(1200);

    const details = await readProductDetails(page);

    const alreadyInCart = await page.getByRole("button", { name: "Increase quantity by one" }).isVisible();
    let extraUnits: number;
    if (alreadyInCart) {
      extraUnits = quantity;
    } else {
      const clicked = await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll("button")).find(
          (b) => /^add to cart$/i.test(b.textContent?.trim() ?? "")
        );
        if (btn) {
          (btn as HTMLElement).click();
          return true;
        }
        return false;
      });
      if (!clicked) return { status: "error", error: "Could not find an Add to Cart button on this product." };
      await page.waitForTimeout(1000);
      extraUnits = quantity - 1; // the Add to Cart click already added one
    }

    for (let i = 0; i < Math.max(0, extraUnits); i++) {
      await page.getByRole("button", { name: "Increase quantity by one" }).click();
      await page.waitForTimeout(400);
    }

    return {
      status: "ok",
      name: details.name,
      price: details.price,
      added: quantity,
      note: alreadyInCart ? "Already in cart — added more units." : null,
    };
  } catch (err) {
    return { status: "error", error: err instanceof Error ? err.message : String(err) };
  }
}
