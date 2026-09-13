// Ported from Agentry's tools/view_cart.py — the real, worked-out scraping approach
// (slice the cart drawer's plain text between "Coupons & offers" and "Bill Summary",
// then parse item lines) against the live storefront.
import { STOREFRONT_URL, getPage } from "./session.js";

export interface CartItem {
  name: string;
  quantity: number;
  price: string | null;
}

export interface ViewCartResult {
  status: "ok" | "error";
  items: CartItem[];
  total?: string | null;
  note?: string;
  error?: string;
}

const WEIGHT_RE = /^\d+\s*(pack|pc|pcs)\b.*\(/i;
const PRICE_RE = /^₹\s?[\d,.]+$/;

function parseItems(section: string): CartItem[] {
  const lines = section
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const items: CartItem[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (!WEIGHT_RE.test(lines[i])) continue;
    const name = i > 0 ? lines[i - 1] : null;
    if (!name) continue;

    const window = lines.slice(i + 1, i + 5);
    const prices = window.filter((l) => PRICE_RE.test(l));
    const qtyLine = window.find((l) => /^\d+$/.test(l));

    items.push({
      name,
      quantity: qtyLine ? parseInt(qtyLine, 10) : 1,
      // last price after MRP-strikethrough is the payable one
      price: prices.length ? prices[prices.length - 1] : null,
    });
  }
  return items;
}

export async function viewCart(): Promise<ViewCartResult> {
  const page = await getPage();
  try {
    await page.goto(`${STOREFRONT_URL}?cart=open`, { waitUntil: "domcontentloaded", timeout: 40000 });

    try {
      await page.waitForSelector("text=Bill Summary", { timeout: 8000 });
    } catch {
      // An empty cart doesn't open a drawer at all.
      return { status: "ok", items: [], total: "₹0", note: "Cart is empty." };
    }
    await page.waitForTimeout(500);

    const sections = await page.evaluate(() => {
      const body = document.body.innerText;
      const itemsStart = body.indexOf("Coupons & offers");
      const billStart = body.indexOf("Bill Summary");
      return {
        items: itemsStart !== -1 && billStart !== -1 ? body.slice(itemsStart, billStart) : "",
        bill: billStart !== -1 ? body.slice(billStart, billStart + 400) : "",
      };
    });

    const items = parseItems(sections.items);

    const toPayMatch = /To Pay\n([^\n]*\n)?(₹[\d,.]+)/.exec(sections.bill);
    const total = toPayMatch ? toPayMatch[2] : null;

    if (!items.length) {
      return { status: "ok", items: [], total, note: "Cart appears to be empty." };
    }

    return { status: "ok", items, total };
  } catch (err) {
    return { status: "error", items: [], error: err instanceof Error ? err.message : String(err) };
  }
}
