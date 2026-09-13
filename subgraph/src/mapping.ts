// Vault402 subgraph mapping — Ethereum Sepolia.
// Run `graph codegen` (after `npm run contracts:compile` + a real deploy patches
// subgraph.yaml's address/startBlock) to generate ../generated/PurchaseLog/PurchaseLog
// and ../generated/schema before this compiles.

import { PurchaseRecorded } from "../generated/PurchaseLog/PurchaseLog";
import { Purchase, Item, Vendor } from "../generated/schema";

export function handlePurchaseRecorded(event: PurchaseRecorded): void {
  const itemId = event.params.item;
  const vendorId = event.params.vendor;

  let item = Item.load(itemId);
  if (item == null) {
    item = new Item(itemId);
    item.name = itemId;
    item.save();
  }

  let vendor = Vendor.load(vendorId);
  if (vendor == null) {
    vendor = new Vendor(vendorId);
    vendor.name = vendorId;
    vendor.save();
  }

  const purchaseId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  const purchase = new Purchase(purchaseId);
  purchase.buyer = event.params.buyer;
  purchase.item = itemId;
  purchase.vendor = vendorId;
  purchase.quantity = event.params.quantity;
  purchase.price = event.params.price;
  purchase.timestamp = event.params.timestamp;
  purchase.save();
}
