import { db } from "@/lib/db";
import { isAdmin } from "@/lib/admin";
import { toCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  if (!isAdmin()) return new Response("Unauthorized", { status: 401 });
  const p = await db.giftProgram.findUnique({ where: { id: Number(params.id) }, include: { choices: { include: { product: true }, orderBy: { createdAt: "asc" } } } });
  if (!p) return new Response("Not found", { status: 404 });
  const rows: unknown[][] = [["עובד", "אימייל", "מוצר", "כתובת", "נבחר ב"]];
  for (const c of p.choices) rows.push([c.name, c.email, c.product.name, c.address, c.createdAt.toISOString()]);
  return new Response(toCsv(rows), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="program-choices.csv"', "cache-control": "no-store" } });
}
