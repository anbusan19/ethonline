// Bridges the browser to the real payment flow. Payment itself (Ledger Key Ring
// decrypt + Hedera signing) happens in the root project's scripts/pay-agent.ts, not
// here — this route just shells out to it, the same way a terminal would, so the
// private key never needs its own copy of the x402/Hedera stack inside web/.
//
// Requires: the vendor server running separately (root: npm run vendor-server) and
// WALLET_PASS present in THIS process's environment (start the web dev server with
// WALLET_PASS=$(security find-generic-password -a default -s ledger-wallet-cli -w)
// npm run dev, same injection pattern as every other wallet-cli call in this repo).
import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";

const run = promisify(execFile);
const ROOT_DIR = path.resolve(process.cwd(), "..");
const ORDER_ID_RE = /Order created: ([0-9a-f-]{36})/;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const items: unknown = body?.items;
  if (!Array.isArray(items) || items.length === 0 || !items.every((i) => typeof i === "string")) {
    return NextResponse.json({ error: "Body must be { items: string[] }." }, { status: 400 });
  }

  const walletPass = process.env.WALLET_PASS;
  if (!walletPass) {
    return NextResponse.json(
      { error: "WALLET_PASS is not set in the web server's environment — see web/README or .env.example." },
      { status: 500 }
    );
  }

  try {
    const { stdout } = await run("npx", ["tsx", "scripts/pay-agent.ts", ...items], {
      cwd: ROOT_DIR,
      env: { ...process.env, WALLET_PASS: walletPass },
      timeout: 60_000,
    });

    const match = ORDER_ID_RE.exec(stdout);
    if (!match) {
      return NextResponse.json({ error: "Payment ran but no order id was found in the output.", raw: stdout }, { status: 502 });
    }

    return NextResponse.json({ orderId: match[1] });
  } catch (err: unknown) {
    const stderr = (err as { stderr?: string })?.stderr ?? (err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: stderr }, { status: 502 });
  }
}
