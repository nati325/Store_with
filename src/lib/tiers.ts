export type TierInput = { minQty: number; unitPrice: number };

/** פורמט "50:20, 100:17.5" (כמות:מחיר בשקלים) לרשימת מדרגות באגורות. מתעלם משורות לא תקינות וממדרגות כפולות. */
export function parseTiers(s: string): TierInput[] {
  const map = new Map<number, number>();
  for (const part of s.split(",")) {
    const [q, p] = part.split(":").map((x) => x.trim());
    const minQty = parseInt(q, 10);
    const price = parseFloat(p);
    if (minQty > 0 && price > 0) map.set(minQty, Math.round(price * 100));
  }
  return Array.from(map, ([minQty, unitPrice]) => ({ minQty, unitPrice })).sort((a, b) => a.minQty - b.minQty);
}

export function tiersToText(tiers: TierInput[]): string {
  return [...tiers].sort((a, b) => a.minQty - b.minQty).map((t) => `${t.minQty}:${t.unitPrice / 100}`).join(", ");
}

export function safeHttpsUrl(s: string): string {
  try { const u = new URL(s.trim()); return u.protocol === "https:" ? u.toString() : ""; } catch { return ""; }
}
