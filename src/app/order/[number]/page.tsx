import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatILS } from "@/lib/pricing";

export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = { NEW: "התקבלה, ממתינה לאישור", CONFIRMED: "אושרה", PAID: "שולמה", SHIPPED: "נשלחה", CANCELLED: "בוטלה" };

export const metadata = { robots: { index: false } };

export default async function OrderDone({ params }: { params: { number: string } }) {
  const o = await db.order.findUnique({ where: { number: params.number }, include: { items: true } });
  if (!o) notFound();
  return (
    <div className="wrap done">
      <div className="check" aria-hidden>✓</div>
      <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)" }}>תודה, ההזמנה התקבלה</h1>
      <p className="muted">מספר הזמנה <span className="ordnum">{o.number}</span></p>
      <p><span className="status" data-s={o.status}>{STATUS[o.status] ?? o.status}</span></p>
      {o.paymentUrl && o.status !== "PAID" && o.status !== "CANCELLED" && (
        <p><a className="btn" href={o.paymentUrl} rel="noopener noreferrer">לתשלום מאובטח</a></p>
      )}
      <div className="panel">
        <table className="plain">
          <thead><tr><th>מוצר</th><th>כמות</th><th>ליחידה</th></tr></thead>
          <tbody>{o.items.map((i) => (<tr key={i.id}><td>{i.name}</td><td>{i.qty}</td><td>{formatILS(i.unitPrice)}</td></tr>))}</tbody>
        </table>
        <div className="sum-row"><span>לפני מע״מ</span><span>{formatILS(o.subtotal)}</span></div>
        <div className="sum-row"><span>מע״מ</span><span>{formatILS(o.vat)}</span></div>
        <div className="sum-row total"><span>סה״כ</span><span>{formatILS(o.total)}</span></div>
      </div>
      <div className="next">
        <div><b>1. בדיקה</b>נבדוק את ההזמנה והזמינות.</div>
        <div><b>2. אישור</b>נשלח אישור אל {o.email}.</div>
        <div><b>3. חשבונית</b>חשבונית מס וקישור לתשלום.</div>
      </div>
      <Link className="btn" href="/">חזרה לחנות</Link>
    </div>
  );
}
