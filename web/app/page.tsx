// Landing page. Section structure ported from Agentry's app/page.tsx (hero, 4-step
// flow, design philosophy, stack list, footer disclosure) — general pattern, not
// code or copy (Start Fresh note). Visual language is AeroGuard's throughout:
// Navbar/TechButton/ParticleJet/tech-grid, Tailwind utilities only, no custom CSS.
import Navbar from "@/components/Navbar";
import TechButton from "@/components/ui/TechButton";
import ParticleJet from "@/components/ParticleJet";
import LiveStats from "@/components/LiveStats";
import RestockPreview from "@/components/RestockPreview";
import TrackBadges from "@/components/TrackBadges";
import { MoveRight } from "lucide-react";

const STEPS = [
  {
    n: "01",
    title: "Decide",
    body: "The agent reasons over its own on-chain purchase history via the subgraph — consumption intervals, not a fixed schedule — to identify what's due for restock.",
  },
  {
    n: "02",
    title: "Unlock",
    body: "The Hedera operator key is decrypted via the Ledger Key Ring (wallet-cli ring decrypt) — encrypted at rest, gated by this Ledger's trustchain, never a raw key sitting in agent code.",
  },
  {
    n: "03",
    title: "Settle",
    body: "The decrypted key signs a Hedera TransferTransaction, routed through the Blocky402 facilitator (x402 v2), and settled on Hedera testnet in HBAR.",
  },
  {
    n: "04",
    title: "Log & reason",
    body: "PurchaseLog emits an event on Ethereum Sepolia; a subgraph indexes it live, and the agent queries it in natural language for the next restock decision.",
  },
];

const STACK = [
  ["Hedera SDK", "Settlement chain — HBAR (asset id 0.0.0), ECDSA operator key, testnet."],
  ["Blocky402", "x402 v2 facilitator — fee-payer fetched live from /supported, never hardcoded."],
  ["Ledger Key Ring (wallet-cli ring)", "Encrypts the Hedera operator key at rest, gated by this Ledger's LKRP trustchain."],
  ["PurchaseLog + The Graph", "A minimal emit-and-forget contract on Ethereum Sepolia, indexed by a live subgraph."],
  ["TypeScript / Node.js", "Agent loop, reasoning layer, and both check scripts and contract tooling."],
];

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="relative bg-aero-black text-aero-text">
        {/* Hero */}
        <section className="relative w-full min-h-screen overflow-hidden flex flex-col md:flex-row">
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundSize: "40px 40px",
              backgroundImage:
                "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
            }}
          />
          <div className="relative w-full md:w-1/2 self-stretch flex flex-col justify-center px-6 md:px-12 lg:px-20 z-10 pt-24">
            <p className="font-mono text-blue-500 text-xs tracking-[0.2em] mb-4">// LEDGER-SECURED · GRAPH-POWERED</p>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-light text-white leading-[1.1] tracking-tight mb-8">
              The pantry
              <br />
              restocks itself.
            </h1>
            <p className="text-gray-400 max-w-md leading-relaxed mb-10 text-sm md:text-base border-l-2 border-blue-900/50 pl-6">
              An autonomous purchase agent that settles real x402 payments on Hedera testnet, gates its
              signing key behind a Ledger Key Ring, and reasons over its own on-chain history via a live
              subgraph — never mocked, never a raw dump.
            </p>
            <div className="flex flex-col sm:flex-row gap-5 mb-16 sm:items-center">
              <a href="/console">
                <TechButton variant="outline">Open Console</TechButton>
              </a>
              <a href="#how">
                <TechButton variant="solid">
                  How it works <MoveRight className="w-4 h-4 ml-2" />
                </TechButton>
              </a>
            </div>
          </div>
          <div className="relative w-full md:w-1/2 h-[50vh] md:h-auto bg-black/50 overflow-hidden">
            <ParticleJet />
            <div className="absolute inset-0 bg-gradient-to-r from-aero-black via-transparent to-transparent z-10" />
          </div>
        </section>

        <LiveStats />

        {/* How it works */}
        <section className="py-24 px-6 md:px-12 lg:px-20 border-t border-white/10" id="how">
          <p className="font-mono text-blue-500 text-xs tracking-[0.2em] mb-4">01 · FLOW</p>
          <h2 className="text-3xl md:text-4xl font-light text-white mb-4">Four moves, one settlement</h2>
          <p className="text-gray-400 max-w-2xl mb-12 text-sm md:text-base">
            Every completed purchase is a real Hedera testnet transaction, gated by hardware-rooted
            encryption and logged for a subgraph to reason over — see the{" "}
            <a href="https://github.com/anbusan19/ethonline2026" className="text-blue-400 underline underline-offset-4">
              repo
            </a>{" "}
            for the full payment flow.
          </p>
          <ol className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map((s) => (
              <li key={s.n} className="border-l border-white/10 pl-6">
                <span className="font-mono text-xs text-gray-600">{s.n}</span>
                <h3 className="text-lg text-white mt-2 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Live reasoning, proven on the page itself */}
        <section className="py-24 px-6 md:px-12 lg:px-20 border-t border-white/10 bg-black/20" id="live">
          <p className="font-mono text-blue-500 text-xs tracking-[0.2em] mb-4">02 · LIVE REASONING</p>
          <h2 className="text-3xl md:text-4xl font-light text-white mb-4">Not asserted — computed, right now</h2>
          <p className="text-gray-400 max-w-2xl mb-12 text-sm md:text-base">
            This isn&rsquo;t a mock-up of what restock reasoning would look like — it&rsquo;s the actual
            output of <code className="text-gray-300">src/reasoning/restock.ts</code> against the live
            subgraph, re-computed on every page load.
          </p>
          <RestockPreview />
        </section>

        {/* Design philosophy */}
        <section className="py-24 px-6 md:px-12 lg:px-20 border-t border-white/10" id="different">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <p className="font-mono text-blue-500 text-xs tracking-[0.2em] mb-4">03 · DESIGN</p>
              <h2 className="text-3xl md:text-4xl font-light text-white mb-4">Device-backed, not device-blocking</h2>
              <p className="text-gray-400 text-sm md:text-base leading-relaxed">
                The Ledger's job is scoped to one thing: nobody but this device's Key Ring can ever
                decrypt the Hedera operator key. That's a stronger guarantee than a live button-press
                per payment, and it's the one Agentry actually makes.
              </p>
            </div>
            <ul className="space-y-4 text-sm text-gray-400">
              <li>
                <strong className="text-white">No raw key in agent code.</strong> The Hedera operator key
                exists in plaintext only transiently, in-process, decrypted via <code>ring decrypt</code>.
              </li>
              <li>
                <strong className="text-white">Live data, not a dump.</strong> Restock/price reasoning runs
                against a real subgraph on Ethereum Sepolia — mocked data disqualifies the Graph track.
              </li>
              <li>
                <strong className="text-white">Scoped by design.</strong> The Ledger gate covers the Hedera
                key only; the PurchaseLog write signs with a plain env-var key, deliberately out of scope.
              </li>
              <li>
                <strong className="text-white">Never v1.</strong> Blocky402 accepts x402 protocol v2 only —
                the fee-payer is fetched live from <code>/supported</code>, never hardcoded.
              </li>
            </ul>
          </div>
        </section>

        {/* Stack */}
        <section className="py-24 px-6 md:px-12 lg:px-20 border-t border-white/10" id="stack">
          <p className="font-mono text-blue-500 text-xs tracking-[0.2em] mb-4">04 · STACK</p>
          <h2 className="text-3xl md:text-4xl font-light text-white mb-12">What it&rsquo;s made of</h2>
          <ul className="divide-y divide-white/10 border-t border-b border-white/10">
            {STACK.map(([name, desc]) => (
              <li key={name} className="flex flex-col md:flex-row md:items-center gap-1 md:gap-8 py-5">
                <span className="font-mono text-sm text-white md:w-72 shrink-0">{name}</span>
                <span className="text-sm text-gray-400">{desc}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Track qualification */}
        <section className="py-24 px-6 md:px-12 lg:px-20 border-t border-white/10 bg-black/20" id="tracks">
          <p className="font-mono text-blue-500 text-xs tracking-[0.2em] mb-4">05 · TRACKS</p>
          <h2 className="text-3xl md:text-4xl font-light text-white mb-4">Three sponsors, one build</h2>
          <p className="text-gray-400 max-w-2xl mb-12 text-sm md:text-base">
            Full qualification checklists and evidence live in the{" "}
            <a href="https://github.com/anbusan19/ethonline2026" className="text-blue-400 underline underline-offset-4">
              README
            </a>
            .
          </p>
          <TrackBadges />
        </section>

        {/* Footer disclosure */}
        <footer className="py-16 px-6 md:px-12 lg:px-20 border-t border-white/10">
          <p className="text-xs text-gray-500 max-w-3xl leading-relaxed mb-3">
            <strong className="text-gray-300">Disclosure.</strong> The restock-reasoning algorithm's general
            shape (interval-based, co-purchase-aware) is adapted from a prior hackathon project, Agentry —
            re-implemented fresh in TypeScript against live on-chain data, not its dataset or code (this
            submission targets the Graph track's Start Fresh pool). This page's visual system is ported
            from AeroGuard, a Vite/React landing page, to Next.js.
          </p>
          <p className="text-xs text-gray-600">ETHOnline 2026 · Hedera · Ledger · The Graph</p>
        </footer>
      </main>
    </>
  );
}
