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
      <h1>הזמנות</h1>
      <table>
        <thead><tr><th>מס׳</th><th>לקוח</th><th>פריטים</th><th>סה״כ</th><th>סטטוס</th></tr></thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>{o.number}<div className="muted">{o.createdAt.toLocaleString("he-IL")}</div></td>
              <td>
                <b>{o.company}</b><br />{o.customerName}<br />
                <span className="muted">{o.email} · {o.phone}</span><br />
                <span className="muted">{o.address}</span>
                {o.eventDate && <div className="muted">מועד רצוי: {o.eventDate}</div>}
                {o.notes && <div className="muted">הערות: {o.notes}</div>}
              </td>
              <td>{o.items.map((i) => (<div key={i.id}>{i.name} × {i.qty}</div>))}</td>
              <td>{formatILS(o.total)}</td>
              <td>
                <form action={setStatus}>
                  <input type="hidden" name="id" value={o.id} />
                  <select name="status" defaultValue={o.status}>
                    {Object.entries(STATUSES).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
                  </select>
                  <button className="btn secondary" style={{ marginTop: 6 }}>עדכון</button>
                </form>
              </td>
            </tr>
          ))}
          {orders.length === 0 && <tr><td colSpan={5}>אין הזמנות עדיין.</td></tr>}
        </tbody>
      </table>
    </>
  );
}
