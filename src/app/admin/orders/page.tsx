import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/admin";
import { formatILS } from "@/lib/pricing";

export const dynamic = "force-dynamic";

const STATUSES: Record<string, string> = { NEW: "חדשה", CONFIRMED: "אושרה", PAID: "שולמה", SHIPPED: "נשלחה", CANCELLED: "בוטלה" };

async function setStatus(formData: FormData) {
  "use server";
  if (!isAdmin()) redirect("/admin/login");
  const status = String(formData.get("status"));
  if (!(status in STATUSES)) return;
  await db.order.update({ where: { id: Number(formData.get("id")) }, data: { status } });
  revalidatePath("/admin/orders");
}

export default async function AdminOrders() {
  if (!isAdmin()) redirect("/admin/login");
  const orders = await db.order.findMany({ orderBy: { createdAt: "desc" }, include: { items: true }, take: 200 });
  return (
    <>
      <h1 style={{ fontSize: "2rem" }}>הזמנות</h1>
      {orders.map((o) => (
        <div className="ocard" key={o.id}>
          <div>
            <span className="num">{o.number}</span> <span className="status" data-s={o.status}>{STATUSES[o.status] ?? o.status}</span>
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
      {orders.length === 0 && <p className="muted">אין הזמנות עדיין.</p>}
    </>
  );
}
