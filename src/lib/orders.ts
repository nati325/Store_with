import { db } from "./db";
import { totals, unitPriceFor } from "./pricing";

export type InLine = { productId: number; qty: number };
export type PricedLine = { productId: number; name: string; qty: number; unitPrice: number; minQty: number; lineTotal: number; error?: string };

/** מחשב מחירים בצד השרת. הלקוח לא קובע מחיר. */
export async function priceLines(input: InLine[]) {
  const ids = input.map((l) => l.productId);
  const products = await db.product.findMany({ where: { id: { in: ids }, active: true }, include: { tiers: true } });
  const lines: PricedLine[] = [];
  for (const l of input) {
    const p = products.find((x) => x.id === l.productId);
    if (!p) { lines.push({ productId: l.productId, name: "מוצר לא זמין", qty: l.qty, unitPrice: 0, minQty: 1, lineTotal: 0, error: "המוצר אינו זמין" }); continue; }
    const qty = Math.floor(Number(l.qty));
    const unitPrice = unitPriceFor(p.basePrice, p.tiers, qty);
    const error = !Number.isFinite(qty) || qty < p.minQty ? `כמות מינימלית: ${p.minQty}` : undefined;
    lines.push({ productId: p.id, name: p.name, qty, unitPrice, minQty: p.minQty, lineTotal: unitPrice * qty, error });
  }
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  return { lines, ...totals(subtotal), ok: lines.length > 0 && lines.every((l) => !l.error) };
}
