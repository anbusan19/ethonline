"use client";

// Vault402's version of Agentry's VoiceStage/"Agentry Vision" — an ambient visual pane
// showing what the agent is doing, over the WebThreads backdrop (ported verbatim from
// Agentry, general pattern only). Retinted from Agentry's petal/sage/paper palette to
// Vault402's blue aerospace theme; content is our own order data, not Agentry's
// ProductTiles/PaymentCard (different data model — this project pays via x402/Hedera
// first, then Zepto Cash, not a single platform-wallet checkout).
//
// Reads the same OrderContext as OrderPanel, so toggling to this view mid-order shows
// the same live state, not a separate copy.

import WebThreads from "./WebThreads";
import { useOrder } from "@/lib/order-context";
import { hashScanTransactionUrl, sepoliaTxUrl } from "@/lib/explorer-links";

const IDLE_COLORS = { color1: "#0f1f4d", color2: "#3b82f6", color3: "#ffffff" };
const ACTIVE_COLORS = { color1: "#1e40af", color2: "#60a5fa", color3: "#ffffff" };
const ALERT_COLORS = { color1: "#7c2d12", color2: "#ef4444", color3: "#fbbf24" };
const DONE_COLORS = { color1: "#14532d", color2: "#4ade80", color3: "#ffffff" };

interface Tile {
  key: string;
  name: string;
  price: string | null;
  image: string | null;
  quantity: number;
  confirmed: boolean;
}

/** Prefer the confirmed cart (real quantity/price, post-checkout) over the
 * search-matched products (pre-checkout, as soon as the agent finds something) —
 * whichever is available, since zepto.items only exists once checkout actually runs. */
function buildTiles(order: ReturnType<typeof useOrder>["order"]): Tile[] {
  if (!order) return [];
  if (order.zepto) {
    return order.zepto.items.map((item, i) => ({
      key: `${item.name}-${i}`,
      name: item.name,
      price: item.price,
      image: item.image ?? null,
      quantity: item.quantity,
      confirmed: true,
    }));
  }
  return (order.products ?? []).map((p, i) => ({
    key: `${p.requestedAs}-${i}`,
    name: p.name ?? p.requestedAs,
    price: p.price,
    image: p.image,
    quantity: 1,
    confirmed: false,
  }));
}

export default function AgentVision() {
  const { order } = useOrder();
  const tiles = buildTiles(order);

  const colors =
    order?.status === "awaiting_user_decision" || order?.status === "failed"
      ? ALERT_COLORS
      : order?.status === "completed"
        ? DONE_COLORS
        : order
          ? ACTIVE_COLORS
          : IDLE_COLORS;

  return (
    <div className="vision">
      <WebThreads
        className="vision__threads"
        color1={colors.color1}
        color2={colors.color2}
        color3={colors.color3}
        speed={0.14}
        threadCount={5}
        frequency={4.0}
        spread={0.16}
        taper={1.0}
        position={0.5}
        fanMode="center"
        glow={0.018}
        falloff={0.62}
        thickness={1.1}
        brightness={0.55}
        opacity={0.5}
        mirror
        grain
        grainIntensity={0.035}
        mouseInteraction
        mouseStrength={0.25}
      />
      <div className="vision__scrim" aria-hidden="true" />

      <div className="vision__head">
        <span className="vision__title">// AGENT VISION</span>
      </div>

      <div className="vision__body">
        {!order && (
          <div className="vision__idle">
          </div>
        )}

        {order && (
          <div className="vision__card">
            <p className="vision__status">
              {order.status === "completed"
                ? "Order complete"
                : order.status === "canceled"
                  ? "Order canceled"
                  : order.status === "failed"
                    ? "Order failed"
                    : order.status === "awaiting_user_decision"
                      ? "Waiting on you"
                      : "Working…"}
            </p>

            {tiles.length > 0 ? (
              <div className="vision__tiles">
                {tiles.map((tile) => (
                  <div key={tile.key} className={`vision__tile ${tile.confirmed ? "vision__tile--confirmed" : ""}`}>
                    <div className="vision__tile-image">
                      {tile.image ? (
                        // eslint-disable-next-line @next/next/no-img-element -- remote Zepto CDN images, plain img avoids domain allowlisting
                        <img src={tile.image} alt={tile.name} loading="lazy" />
                      ) : (
                        <span className="vision__tile-placeholder">{tile.name.slice(0, 1).toUpperCase()}</span>
                      )}
                    </div>
                    <p className="vision__tile-name">{tile.name}</p>
                    <div className="vision__tile-meta">
                      {tile.quantity > 1 && <span>{tile.quantity}×</span>}
                      {tile.price && <span>{tile.price}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <ul className="vision__items">
                {order.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}

            <div className="vision__row">
              <span>{order.x402.amountHbar} HBAR fee</span>
              <a href={hashScanTransactionUrl(order.x402.transactionId)} target="_blank" rel="noopener noreferrer">
                HashScan ↗
              </a>
            </div>

            {order.zepto && (
              <div className="vision__row">
                <span>{order.zepto.total} on Zepto</span>
                {order.zepto.purchaseLogTxHashes[0] && (
                  <a href={sepoliaTxUrl(order.zepto.purchaseLogTxHashes[0])} target="_blank" rel="noopener noreferrer">
                    PurchaseLog ↗
                  </a>
                )}
              </div>
            )}

            {order.failureReason && <p className="vision__note">{order.failureReason}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
