import { db } from "@/lib/db";
import { isAdmin } from "@/lib/admin";
import { toCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAdmin()) return new Response("Unauthorized", { status: 401 });
  const orders = await db.order.findMany({ orderBy: { createdAt: "desc" }, include: { items: true } });
  const rows: unknown[][] = [["מספר", "תאריך", "סטטוס", "חברה", "ח.פ.", "איש קשר", "אימייל", "טלפון", "כתובת", "פריטים", "לפני מע״מ", "מע״מ", "סה״כ"]];
  for (const o of orders) {
    rows.push([o.number, o.createdAt.toISOString(), o.status, o.company, o.taxId, o.customerName, o.email, o.phone, o.address,
      o.items.map((i) => `${i.name} x${i.qty}`).join("; "), o.subtotal / 100, o.vat / 100, o.total / 100]);
  }
  return new Response(toCsv(rows), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="orders.csv"', "cache-control": "no-store" } });
}
