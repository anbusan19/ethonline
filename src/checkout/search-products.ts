// Ported from Agentry's tools/search_products.py — the real, worked-out selectors
// (data-testid="product-card", regexes over its visible text) against the live
// storefront.
import { STOREFRONT_URL, getPage } from "./session.js";

export interface ProductResult {
  name: string;
  price: string;
  url: string;
  image: string;
}

export interface SearchProductsResult {
  status: "ok" | "not_found" | "error";
  results: ProductResult[];
  error?: string;
}

function extractResults(max: number): ProductResult[] {
  const results: ProductResult[] = [];
  const cards = Array.from(document.querySelectorAll('[data-testid="product-card"]'));
  for (const card of cards) {
    const href = card.getAttribute("href") || "";
    const lines = (card as HTMLElement).innerText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const price = lines.find((l) => /^₹\d/.test(l)) || "—";
    const name = lines.find(
      (l) =>
        !/^₹/.test(l) &&
        l !== "OFF" &&
        l !== "ADD" &&
        !/^\d+(\.\d+)?$/.test(l) &&
        !/^\(\d+(\.\d+)?[km]?\)$/i.test(l) &&
        !/^\d+\.?\d*\s*(pack|pc|pcs|ml|g|kg|l|ltr|litre|liters?)\b/i.test(l)
    );
    const img = card.querySelector("img");
    const image = img ? img.getAttribute("src") || "" : "";

    if (name && href && !results.find((r) => r.url === href)) {
      results.push({ name, price, url: href, image });
    }
    if (results.length >= max) break;
  }
  return results;
}

export async function searchProducts(query: string, limit = 5): Promise<SearchProductsResult> {
  const page = await getPage();
  try {
    await page.goto(`${STOREFRONT_URL}/search?query=${encodeURIComponent(query)}`, {
      waitUntil: "domcontentloaded",
      timeout: 40000,
    });
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });
    await page.waitForTimeout(500);

    const results = await page.evaluate(extractResults, limit);
    if (!results.length) {
      return { status: "not_found", results: [], error: `No products found for "${query}"` };
    }
    return { status: "ok", results };
  } catch (err) {
    return { status: "error", results: [], error: err instanceof Error ? err.message : String(err) };
  }
}
