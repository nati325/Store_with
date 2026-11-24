export type Tier = { minQty: number; unitPrice: number };

export const VAT_RATE = 0.18;

/** מחיר ליחידה (באגורות) לפי כמות: המדרגה הגבוהה ביותר שהכמות עומדת בה. */
export function unitPriceFor(basePrice: number, tiers: Tier[], qty: number): number {
  let price = basePrice;
  let best = 0;
  for (const t of tiers) {
    if (qty >= t.minQty && t.minQty >= best) {
      best = t.minQty;
      price = t.unitPrice;
    }
  }
  return price;
}

export function totals(subtotal: number) {
  const vat = Math.round(subtotal * VAT_RATE);
  return { subtotal, vat, total: subtotal + vat };
}

export function formatILS(agorot: number): string {
  return new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS" }).format(agorot / 100);
}
