import Link from "next/link";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { STATUSES } from "@/lib/statuses";
import { formatILS } from "@/lib/pricing";

export const dynamic = "force-dynamic";


async function setStatus(formData: FormData) {
  "use server";
  requireAdmin();
  const status = String(formData.get("status"));
  if (!(status in STATUSES)) return;
  const id = Number(formData.get("id"));
  const cur = await db.order.findUnique({ where: { id }, select: { paidAt: true } });
  await db.order.update({ where: { id }, data: { status, ...(status === "PAID" && !cur?.paidAt ? { paidAt: new Date() } : {}) } });
  revalidatePath("/admin/orders");
}

export default async function AdminOrders({ searchParams }: { searchParams: { status?: string; q?: string } }) {
  requireAdmin();
  const q = (searchParams.q ?? "").trim();
  const orders = await db.order.findMany({
    where: {
      ...(searchParams.status && searchParams.status in STATUSES ? { status: searchParams.status } : {}),
      ...(q ? { OR: [{ number: { contains: q, mode: "insensitive" } }, { company: { contains: q, mode: "insensitive" } }, { customerName: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } : {}),
    },
    orderBy: { createdAt: "desc" }, include: { items: true }, take: 200,
  });
  return (
    <>
      <div className="row-between">
        <h1 style={{ fontSize: "2rem", margin: 0 }}>הזמנות</h1>
        <a className="btn secondary small" href="/admin/export">ייצוא ל-CSV</a>
      </div>
      <form className="toolbar" method="get" style={{ marginTop: 16 }}>
        <input type="search" name="q" defaultValue={q} placeholder="חיפוש לפי מספר, חברה, שם או אימייל" aria-label="חיפוש" />
        <select name="status" defaultValue={searchParams.status ?? ""} aria-label="סטטוס">
          <option value="">כל הסטטוסים</option>
          {Object.entries(STATUSES).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
        </select>
        <button className="btn secondary">סינון</button>
      </form>
      {orders.map((o) => (
        <div className="ocard" key={o.id}>
          <div>
            <Link href={`/admin/orders/${o.id}`} className="num" style={{ textDecoration: "underline" }}>{o.number}</Link> <span className="status" data-s={o.status}>{STATUSES[o.status] ?? o.status}</span>
            <div className="muted">{o.createdAt.toLocaleString("he-IL")}</div>
            <p style={{ margin: "10px 0 0" }}><b>{o.company}</b> · {o.customerName}<br />
              <span className="muted">{o.email} · {o.phone}<br />{o.address}</span></p>
            {o.eventDate && <div className="muted">מועד רצוי: {o.eventDate}</div>}
            {o.notes && <div className="muted">הערות: {o.notes}</div>}
          </div>
          <div>
            {o.items.map((i) => (<div key={i.id}>{i.name} × {i.qty}</div>))}
            <p style={{ margin: "10px 0 0" }}><b>{formatILS(o.total)}</b> <span className="muted">כולל מע״מ</span></p>
          </div>
          <form action={setStatus}>
            <input type="hidden" name="id" value={o.id} />
            <select name="status" defaultValue={o.status} aria-label="סטטוס">
              {Object.entries(STATUSES).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
            </select>
            <button className="btn small block" style={{ marginTop: 8 }}>עדכון</button>
          </form>
        </div>
      ))}
      {orders.length === 0 && <p className="muted">אין הזמנות להצגה.</p>}
    </>
  );
}
