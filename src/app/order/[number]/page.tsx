import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatILS } from "@/lib/pricing";
import { tokenOk } from "@/lib/orderMail";
import { CUSTOMER_STATUS } from "@/lib/statuses";
import ReorderButton from "@/components/ReorderButton";
import { respondProof } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "מעקב הזמנה", robots: { index: false } };

export default async function OrderDone({ params, searchParams }: { params: { number: string }; searchParams: { t?: string; err?: string } }) {
  const o = await db.order.findUnique({ where: { number: params.number }, include: { items: { include: { product: { select: { slug: true } } } } } });
  if (!o || !tokenOk(searchParams.t, o.token)) notFound();
  return (
    <div className="wrap done">
      <div className="check" aria-hidden>✓</div>
      <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)" }}>תודה, ההזמנה התקבלה</h1>
      <p className="muted">מספר הזמנה <span className="ordnum">{o.number}</span></p>
      <p><span className="status" data-s={o.status}>{CUSTOMER_STATUS[o.status] ?? o.status}</span></p>
      {o.paymentUrl && o.status !== "PAID" && o.status !== "CANCELLED" && (
        <p><a className="btn" href={o.paymentUrl} rel="noopener noreferrer">לתשלום מאובטח</a></p>
      )}

      {o.proofStatus !== "NONE" && o.proofUrl && (
        <div className="panel proof">
          <h3>הדמיה לאישור</h3>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={o.proofUrl} alt="הדמיה של המוצר עם הלוגו" className="proof-img" />
          {o.proofNote && <p>{o.proofNote}</p>}
          {o.proofStatus === "SENT" ? (
            <form action={respondProof}>
              <input type="hidden" name="number" value={o.number} />
              <input type="hidden" name="token" value={o.token} />
              <label htmlFor="reply">הערות לשינוי (חובה אם מבקשים שינויים)</label>
              <textarea id="reply" name="reply" rows={3} />
              {searchParams.err === "reply" && <p className="error" role="alert">נא לפרט מה לשנות</p>}
              <div className="hero-cta" style={{ marginTop: 14 }}>
                <button className="btn" name="decision" value="approve">אישור ההדמיה</button>
                <button className="btn secondary" name="decision" value="changes">בקשת שינויים</button>
              </div>
            </form>
          ) : (
            <p><span className="status" data-s={o.proofStatus === "APPROVED" ? "PAID" : "NEW"}>{o.proofStatus === "APPROVED" ? "אישרתם את ההדמיה" : "ביקשתם שינויים, נשלח הדמיה מעודכנת"}</span>{o.proofReply && <><br /><span className="muted">{o.proofReply}</span></>}</p>
          )}
        </div>
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
        <div><b>2. אישור והדמיה</b>נשלח אישור{o.logoUrl ? " והדמיה עם הלוגו" : ""} אל {o.email}.</div>
        <div><b>3. חשבונית</b>חשבונית מס וקישור לתשלום.</div>
      </div>
      <div className="hero-cta" style={{ justifyContent: "center" }}>
        <ReorderButton items={o.items.map((i) => ({ productId: i.productId, slug: i.product.slug, name: i.name, qty: i.qty }))} />
        <Link className="btn" href="/">חזרה לחנות</Link>
      </div>
    </div>
  );
}
