import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { STATUSES } from "@/lib/statuses";
import { formatILS } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  requireAdmin();
  const [byStatus, revenue, newQuotes, recent, productCount] = await Promise.all([
    db.order.groupBy({ by: ["status"], _count: true }),
    db.order.aggregate({ where: { status: { in: ["PAID", "SHIPPED"] } }, _sum: { total: true } }),
    db.quoteRequest.count({ where: { status: "NEW" } }),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    db.product.count({ where: { active: true } }),
  ]);
  const count = (s: string) => byStatus.find((x) => x.status === s)?._count ?? 0;
  const open = db.order.aggregate({ where: { status: { in: ["NEW", "CONFIRMED"] } }, _sum: { total: true } });
  const openSum = (await open)._sum.total ?? 0;

  return (
    <>
      <h1 style={{ fontSize: "2rem" }}>סקירה</h1>
      <div className="stats">
        <Link href="/admin/orders?status=NEW" className="stat"><span className="muted">הזמנות חדשות</span><b>{count("NEW")}</b></Link>
        <Link href="/admin/orders?status=CONFIRMED" className="stat"><span className="muted">אושרו, ממתינות לתשלום</span><b>{count("CONFIRMED")}</b></Link>
        <Link href="/admin/quotes" className="stat"><span className="muted">בקשות הצעת מחיר</span><b>{newQuotes}</b></Link>
        <div className="stat"><span className="muted">הכנסות (שולמו ונשלחו, כולל מע״מ)</span><b>{formatILS(revenue._sum.total ?? 0)}</b></div>
        <div className="stat"><span className="muted">שווי הזמנות פתוחות</span><b>{formatILS(openSum)}</b></div>
        <Link href="/admin/products" className="stat"><span className="muted">מוצרים פעילים</span><b>{productCount}</b></Link>
      </div>
      <h2 style={{ marginTop: 32 }}>הזמנות אחרונות</h2>
      {recent.map((o) => (
        <Link key={o.id} href={`/admin/orders/${o.id}`} className="ocard" style={{ gridTemplateColumns: "1fr 1fr auto" }}>
          <div><span className="num">{o.number}</span> <span className="status" data-s={o.status}>{STATUSES[o.status] ?? o.status}</span></div>
          <div><b>{o.company}</b><div className="muted">{o.createdAt.toLocaleString("he-IL")}</div></div>
          <b>{formatILS(o.total)}</b>
        </Link>
      ))}
      {recent.length === 0 && <p className="muted">אין הזמנות עדיין.</p>}
    </>
  );
}

