// Summarizes the three ETHGlobal sponsor tracks this build targets and what each one
// actually requires — condensed from README's track qualification mapping, not
// separate marketing copy, so it can't drift out of sync with the real checklist.
const TRACKS = [
  {
    name: "Hedera",
    track: "AI & Agentic Payments",
    body: "A live x402-gated payment, settled through the Blocky402 facilitator on Hedera testnet in HBAR — fee-payer fetched live from /supported, never hardcoded.",
  },
  {
    name: "Ledger",
    track: "AI Agents x Ledger",
    body: "wallet-cli ring is the real key backend for the Hedera operator key — encrypted at rest, decrypted only by this device's trustchain. No Signer Kit, no live per-payment confirmation.",
  },
  {
    name: "The Graph",
    track: "Best AI Use Case · Start Fresh",
    body: "Live, not mocked: PurchaseLog on Ethereum Sepolia, indexed by a real subgraph, reasoned over by an actual interval algorithm — see the numbers above.",
  },
];

export default function TrackBadges() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/10">
      {TRACKS.map((t) => (
        <div key={t.name} className="bg-aero-black p-6">
          <p className="font-mono text-[10px] text-blue-500 uppercase tracking-widest mb-2">{t.track}</p>
          <h3 className="text-lg text-white mb-3">{t.name}</h3>
          <p className="text-sm text-gray-400 leading-relaxed">{t.body}</p>
        </div>
      ))}
    </div>
  );
}
