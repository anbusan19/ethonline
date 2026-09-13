// Thin proxy to the vendor server's GET /orders/:id — see create-order/route.ts's
// header for why this stays a separate process rather than reimplementing the order
// store inside web/.
import { NextResponse } from "next/server";

const VENDOR_SERVER_URL = process.env.VAULT402_ORDER_SERVER_URL ?? "http://localhost:4021";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const res = await fetch(`${VENDOR_SERVER_URL}/orders/${id}`, { cache: "no-store" });
    const body = await res.json();
    return NextResponse.json(body, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      { error: `Could not reach the order server: ${err instanceof Error ? err.message : String(err)}` },
      { status: 502 }
    );
  }
}
