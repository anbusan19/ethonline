import { searchProducts } from "../src/checkout/search-products.js";
import { viewCart } from "../src/checkout/view-cart.js";
import { closeSession } from "../src/checkout/session.js";

async function main(): Promise<void> {
  const search = await searchProducts("amul milk 500ml", 3);
  console.log("search:", JSON.stringify(search, null, 2));

  const cart = await viewCart();
  console.log("cart:", JSON.stringify(cart, null, 2));

  await closeSession();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
