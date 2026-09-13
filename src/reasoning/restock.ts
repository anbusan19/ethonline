// Vault402 — restock-interval reasoning.
//
// Ported (general algorithm, not the code) from Agentry's knowledge/graph.py
// (restock_suggestions / _avg_interval_days) — see CLAUDE.md's Start Fresh note:
// architecture patterns from a prior agent are fine to reuse, a lifted deployment or
// dataset is not. Here the *data* is genuinely fresh: this operates on live PurchaseLog
// events from the subgraph (see src/subgraph/client.ts), not Agentry's local JSON graph.
//
// Restock rule per README: flag an item when daysSinceLastPurchase > averageInterval * 0.9.
// Needs at least two recorded purchases of an item to estimate its interval — a brand-new
// item returns nothing, which is expected, not an error.

export interface PurchaseRecord {
  item: string;
  vendor: string;
  timestamp: Date;
}

export interface RestockSuggestion {
  item: string;
  usualIntervalDays: number;
  daysSinceLast: number;
  overdue: boolean;
  oftenBoughtWith: string[];
}

function normalize(item: string): string {
  return item.trim().toLowerCase().replace(/\s+/g, " ");
}

function averageIntervalDays(timestamps: Date[]): number | null {
  if (timestamps.length < 2) return null;
  const sorted = [...timestamps].sort((a, b) => a.getTime() - b.getTime());
  const gapsDays: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    gapsDays.push((sorted[i].getTime() - sorted[i - 1].getTime()) / 86_400_000);
  }
  return gapsDays.reduce((a, b) => a + b, 0) / gapsDays.length;
}

/**
 * Co-purchase counts between items bought in the same order. "Same order" here means
 * purchases sharing an identical timestamp — PurchaseLog logs one item per event, so
 * items from a single real-world order are grouped by having been recorded at the same
 * moment (see scripts/backfill-purchase-history.ts, which preserves this on replay).
 */
function coPurchaseCounts(records: PurchaseRecord[]): Map<string, Map<string, number>> {
  const byTimestamp = new Map<number, Set<string>>();
  for (const r of records) {
    const key = r.timestamp.getTime();
    const item = normalize(r.item);
    if (!byTimestamp.has(key)) byTimestamp.set(key, new Set());
    byTimestamp.get(key)!.add(item);
  }

  const counts = new Map<string, Map<string, number>>();
  const bump = (a: string, b: string) => {
    if (!counts.has(a)) counts.set(a, new Map());
    counts.get(a)!.set(b, (counts.get(a)!.get(b) ?? 0) + 1);
  };

  for (const items of byTimestamp.values()) {
    const arr = [...items];
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        bump(arr[i], arr[j]);
        bump(arr[j], arr[i]);
      }
    }
  }
  return counts;
}

/**
 * Return items whose typical restock interval says they're due (or overdue) within
 * `withinDays`, each with its top co-purchased items (see coPurchaseCounts above).
 */
export function restockSuggestions(
  records: PurchaseRecord[],
  withinDays = 3,
  now: Date = new Date()
): RestockSuggestion[] {
  const byItem = new Map<string, Date[]>();
  for (const r of records) {
    const item = normalize(r.item);
    if (!byItem.has(item)) byItem.set(item, []);
    byItem.get(item)!.push(r.timestamp);
  }

  const coPurchase = coPurchaseCounts(records);
  const due: RestockSuggestion[] = [];

  for (const [item, timestamps] of byItem) {
    const interval = averageIntervalDays(timestamps);
    if (interval === null) continue;

    const last = new Date(Math.max(...timestamps.map((t) => t.getTime())));
    const daysSinceLast = (now.getTime() - last.getTime()) / 86_400_000;
    const daysUntilDue = interval - daysSinceLast;

    if (daysUntilDue <= withinDays) {
      const neighbors = [...(coPurchase.get(item)?.entries() ?? [])].sort((a, b) => b[1] - a[1]);
      due.push({
        item,
        usualIntervalDays: Math.round(interval * 10) / 10,
        daysSinceLast: Math.round(daysSinceLast * 10) / 10,
        overdue: daysUntilDue < 0,
        oftenBoughtWith: neighbors.slice(0, 3).map(([name]) => name),
      });
    }
  }

  due.sort((a, b) => (b.daysSinceLast - b.usualIntervalDays) - (a.daysSinceLast - a.usualIntervalDays));
  return due;
}
