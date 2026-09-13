// Vault402 — simple JSON-file order store. One record per order, tracking the
// x402/Hedera service-fee settlement separately from the Zepto Cash product
// purchase, per the corrected flow (never conflate the two).
//
// data/orders.json is gitignored (see .gitignore's "data/" rule) — order history is
// local operational state, not something to ship in the repo.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const STORE_PATH = path.join("data", "orders.json");

export type OrderStatus =
  | "payment_settled"
  | "checking_out"
  | "awaiting_user_decision"
  | "completed"
  | "canceled"
  | "failed";

export interface ZeptoCartItem {
  name: string;
  quantity: number;
  price: string | null; // e.g. "₹83"
}

export interface Order {
  id: string;
  status: OrderStatus;
  /** The shopping list as requested, e.g. ["amul milk 500ml", "bread"]. */
  items: string[];
  /** The x402/Hedera service fee — separate from the Zepto product purchase below. */
  x402: {
    transactionId: string;
    amountHbar: number;
    payer: string;
  };
  /** Populated only once the real Zepto Cash purchase is verified. */
  zepto?: {
    items: ZeptoCartItem[];
    total: string | null;
    orderId: string | null;
    /** PurchaseLog transaction hashes, one per item, Ethereum Sepolia. */
    purchaseLogTxHashes: string[];
  };
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}

async function readStore(): Promise<Record<string, Order>> {
  try {
    return JSON.parse(await readFile(STORE_PATH, "utf-8"));
  } catch {
    return {};
  }
}

async function writeStore(store: Record<string, Order>): Promise<void> {
  await mkdir(path.dirname(STORE_PATH), { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2));
}

export async function createOrder(id: string, items: string[], x402: Order["x402"]): Promise<Order> {
  const now = new Date().toISOString();
  const order: Order = { id, status: "payment_settled", items, x402, createdAt: now, updatedAt: now };
  const store = await readStore();
  store[id] = order;
  await writeStore(store);
  return order;
}

export async function getOrder(id: string): Promise<Order | undefined> {
  const store = await readStore();
  return store[id];
}

export async function updateOrder(id: string, patch: Partial<Order>): Promise<Order> {
  const store = await readStore();
  const existing = store[id];
  if (!existing) throw new Error(`Order ${id} not found.`);
  const updated: Order = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  store[id] = updated;
  await writeStore(store);
  return updated;
}
