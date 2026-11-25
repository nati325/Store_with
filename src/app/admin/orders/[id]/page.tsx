import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { formatILS } from "@/lib/pricing";
import { safeHttpsUrl } from "@/lib/tiers";
import { STATUSES, PROOF } from "@/lib/statuses";
import { newToken, orderLink, sendOrderUpdate } from "@/lib/orderMail";
import { saveImage } from "@/lib/uploads";

export const dynamic = "force-dynamic";

async function ensureToken(id: number) {
  const o = await db.order.findUniqueOrThrow({ where: { id } });
  return o.token ? o : db.order.update({ where: { id }, data: { token: newToken() } });
}

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
  if (formData.get("notify") === "on") await sendOrderUpdate(await ensureToken(id));
  revalidatePath(`/admin/orders/${id}`);
}

async function sendProof(formData: FormData) {
  "use server";
  requireAdmin();
  const id = Number(formData.get("id"));
  const back = `/admin/orders/${id}`;
  const f = formData.get("proof");
  if (!(f instanceof File) || f.size === 0) redirect(back + "?error=" + encodeURIComponent("נא לבחור קובץ הדמיה"));
  let url = "";
  try { url = await saveImage(f); } catch (e) { redirect(back + "?error=" + encodeURIComponent((e as Error).message)); }
  const o = await ensureToken(id);
  const updated = await db.order.update({ where: { id }, data: { proofUrl: url, proofStatus: "SENT", proofNote: String(formData.get("proofNote") ?? "").slice(0, 1000), proofReply: "" } });
  await sendOrderUpdate({ ...updated, token: o.token });
  revalidatePath(back);
  redirect(back + "?sent=1");
}

async function emailCustomer(formData: FormData) {
  "use server";
  requireAdmin();
  const id = Number(formData.get("id"));
  await sendOrderUpdate(await ensureToken(id));
  revalidatePath(`/admin/orders/${id}`);
}

export default async function AdminOrder({ params, searchParams }: { params: { id: string }; searchParams: { error?: string; sent?: string } }) {
  requireAdmin();
  const o = await db.order.findUnique({ where: { id: Number(params.id) }, include: { items: true } });
  if (!o) notFound();
  return (
    <>
      <p><Link href="/admin/orders" className="muted">← כל ההזמנות</Link></p>
      <div className="row-between">
        <h1 style={{ fontSize: "2rem", margin: 0 }}><span style={{ direction: "ltr", display: "inline-block" }}>{o.number}</span> <span className="status" data-s={o.status}>{STATUSES[o.status]}</span></h1>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {o.token && <a className="btn secondary small" href={orderLink(o)} target="_blank" rel="noopener noreferrer">דף הלקוח</a>}
          <Link className="btn secondary small" href={`/admin/orders/${o.id}/invoice`}>אישור הזמנה להדפסה</Link>
        </div>
      </div>
      <p className="muted">נוצרה ב-{o.createdAt.toLocaleString("he-IL")}{o.paidAt && ` · שולמה ב-${o.paidAt.toLocaleString("he-IL")}`}</p>
      <div className="two-col">
        <div className="panel">
          <h3>לקוח</h3>
          <p><b>{o.company}</b>{o.taxId && ` (ח.פ. ${o.taxId})`}<br />{o.customerName}<br />
            <a href={`mailto:${o.email}`}>{o.email}</a> · <a href={`tel:${o.phone}`}>{o.phone}</a><br />{o.address}</p>
          {o.eventDate && <p className="muted">מועד רצוי: {o.eventDate}</p>}
          {o.shipTo && <p className="muted" style={{ whiteSpace: "pre-wrap" }}>משלוח למספר כתובות:{"\n"}{o.shipTo}</p>}
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

      <div className="panel" style={{ marginTop: 16 }}>
        <h3>לוגו והדמיה</h3>
        {searchParams.error && <p className="error" role="alert">{searchParams.error}</p>}
        {searchParams.sent && <p style={{ color: "var(--ok)", fontWeight: 700 }} role="status">ההדמיה נשלחה ללקוח</p>}
        <div className="two-col">
          <div>
            <p className="muted">לוגו שהלקוח העלה</p>
            {o.logoUrl ? (
              <a href={o.logoUrl} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={o.logoUrl} alt="לוגו הלקוח" style={{ maxWidth: 240, maxHeight: 160, objectFit: "contain", background: "var(--surface-2)", borderRadius: 10, padding: 8 }} />
              </a>
            ) : <p className="muted">לא הועלה לוגו</p>}
          </div>
          <div>
            <p className="muted">מצב הדמיה: <span className="status" data-s={o.proofStatus === "APPROVED" ? "PAID" : o.proofStatus === "CHANGES" ? "CANCELLED" : "NEW"}>{PROOF[o.proofStatus]}</span></p>
            {o.proofUrl && (/* eslint-disable-next-line @next/next/no-img-element */ <img src={o.proofUrl} alt="ההדמיה שנשלחה" style={{ maxWidth: 240, borderRadius: 10 }} />)}
            {o.proofReply && <p>תגובת הלקוח: {o.proofReply}</p>}
          </div>
        </div>
        <form action={sendProof} style={{ marginTop: 12 }}>
          <input type="hidden" name="id" value={o.id} />
          <label htmlFor="proof">קובץ הדמיה (תמונה)</label>
          <input id="proof" name="proof" type="file" accept="image/jpeg,image/png,image/webp,image/gif" required />
          <label htmlFor="proofNote">הערה ללקוח</label>
          <input id="proofNote" name="proofNote" defaultValue={o.proofNote} />
          <p style={{ marginTop: 12 }}><button className="btn">שליחת הדמיה לאישור</button></p>
        </form>
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
        <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12 }}><input type="checkbox" name="notify" style={{ width: "auto" }} /> לשלוח ללקוח עדכון באימייל (דורש SMTP)</label>
        <p style={{ marginTop: 16 }}><button className="btn">שמירה</button></p>
      </form>
      <form action={emailCustomer} className="panel" style={{ marginTop: 16 }}>
        <input type="hidden" name="id" value={o.id} />
        <p className="muted" style={{ margin: "0 0 12px" }}>שולח ללקוח אימייל עם הסטטוס הנוכחי וקישור למעקב (ולתשלום אם הוגדר).</p>
        <button className="btn secondary">שליחת עדכון ללקוח</button>
      </form>
    </>
  );
}
