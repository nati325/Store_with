import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { STATUSES } from "@/lib/statuses";
import { formatILS } from "@/lib/pricing";
import { safeHttpsUrl } from "@/lib/tiers";
import { sendMail, siteUrl } from "@/lib/mail";

export const dynamic = "force-dynamic";


async function save(formData: FormData) {
  "use server";
  requireAdmin();
  const id = Number(formData.get("id"));
  const status = String(formData.get("status"));
  if (!(status in STATUSES)) return;
  const cur = await db.order.findUnique({ where: { id }, select: { paidAt: true } });
  await db.order.update({
    where: { id },
    data: {
      status,
      paymentUrl: safeHttpsUrl(String(formData.get("paymentUrl") ?? "")),
      adminNotes: String(formData.get("adminNotes") ?? "").slice(0, 2000),
      ...(status === "PAID" && !cur?.paidAt ? { paidAt: new Date() } : {}),
    },
  });
  revalidatePath(`/admin/orders/${id}`);
}

async function emailCustomer(formData: FormData) {
  "use server";
  requireAdmin();
  const id = Number(formData.get("id"));
  const o = await db.order.findUnique({ where: { id } });
  if (!o) return;
  const link = `${siteUrl()}/order/${o.number}`;
  await sendMail({
    to: o.email,
    subject: `עדכון להזמנה ${o.number}`,
    text: `שלום ${o.customerName},\n\nההזמנה שלכם עודכנה. סטטוס: ${STATUSES[o.status]}.\n${o.paymentUrl && o.status !== "PAID" ? `\nלתשלום: ${o.paymentUrl}\n` : ""}\nמעקב ופרטים: ${link}`,
  });
  revalidatePath(`/admin/orders/${id}`);
}

export default async function AdminOrder({ params }: { params: { id: string } }) {
  requireAdmin();
  const o = await db.order.findUnique({ where: { id: Number(params.id) }, include: { items: true } });
  if (!o) notFound();
  return (
    <>
      <p><Link href="/admin/orders" className="muted">← כל ההזמנות</Link></p>
      <div className="row-between">
        <h1 style={{ fontSize: "2rem", margin: 0 }}><span style={{ direction: "ltr", display: "inline-block" }}>{o.number}</span> <span className="status" data-s={o.status}>{STATUSES[o.status]}</span></h1>
        <Link className="btn secondary small" href={`/admin/orders/${o.id}/invoice`}>אישור הזמנה להדפסה</Link>
      </div>
      <p className="muted">נוצרה ב-{o.createdAt.toLocaleString("he-IL")}{o.paidAt && ` · שולמה ב-${o.paidAt.toLocaleString("he-IL")}`}</p>
      <div className="two-col">
        <div className="panel">
          <h3>לקוח</h3>
          <p><b>{o.company}</b>{o.taxId && ` (ח.פ. ${o.taxId})`}<br />{o.customerName}<br />
            <a href={`mailto:${o.email}`}>{o.email}</a> · <a href={`tel:${o.phone}`}>{o.phone}</a><br />{o.address}</p>
          {o.eventDate && <p className="muted">מועד רצוי: {o.eventDate}</p>}
          {o.notes && <p className="muted">הערות הלקוח: {o.notes}</p>}
        </div>
        <div className="panel">
          <h3>פריטים</h3>
          <table className="plain">
            <thead><tr><th>מוצר</th><th>כמות</th><th>ליחידה</th><th>סה״כ</th></tr></thead>
            <tbody>{o.items.map((i) => (<tr key={i.id}><td>{i.name}</td><td>{i.qty}</td><td>{formatILS(i.unitPrice)}</td><td>{formatILS(i.unitPrice * i.qty)}</td></tr>))}</tbody>
          </table>
          <div className="sum-row"><span>לפני מע״מ</span><span>{formatILS(o.subtotal)}</span></div>
          <div className="sum-row"><span>מע״מ</span><span>{formatILS(o.vat)}</span></div>
          <div className="sum-row total"><span>סה״כ</span><span>{formatILS(o.total)}</span></div>
        </div>
      </div>
      <form action={save} className="panel" style={{ marginTop: 16 }}>
        <input type="hidden" name="id" value={o.id} />
        <h3>טיפול בהזמנה</h3>
        <div className="row">
          <div><label htmlFor="status">סטטוס</label>
            <select id="status" name="status" defaultValue={o.status}>{Object.entries(STATUSES).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}</select></div>
          <div style={{ gridColumn: "span 2" }}><label htmlFor="paymentUrl">קישור תשלום (https, מהסולק שבו אתם משתמשים)</label>
            <input id="paymentUrl" name="paymentUrl" type="url" defaultValue={o.paymentUrl} placeholder="https://" dir="ltr" /></div>
        </div>
        <label htmlFor="adminNotes">הערות פנימיות (לא מוצגות ללקוח)</label>
        <textarea id="adminNotes" name="adminNotes" rows={3} defaultValue={o.adminNotes} />
        <p style={{ marginTop: 16 }}><button className="btn">שמירה</button></p>
      </form>
      <form action={emailCustomer} className="panel" style={{ marginTop: 16 }}>
        <input type="hidden" name="id" value={o.id} />
        <p className="muted" style={{ margin: "0 0 12px" }}>שולח ללקוח אימייל עם הסטטוס הנוכחי וקישור התשלום (אם הוגדר ושמור). דורש הגדרת SMTP.</p>
        <button className="btn secondary">שליחת עדכון ללקוח</button>
      </form>
    </>
  );
}
