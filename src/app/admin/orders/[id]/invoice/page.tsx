import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { formatILS } from "@/lib/pricing";
import PrintButton from "@/components/PrintButton";

export const dynamic = "force-dynamic";

export default async function Invoice({ params }: { params: { id: string } }) {
  requireAdmin();
  const o = await db.order.findUnique({ where: { id: Number(params.id) }, include: { items: true } });
  if (!o) notFound();
  return (
    <div className="doc">
      <div className="row-between no-print"><PrintButton /></div>
      <h1 style={{ fontSize: "2rem" }}>אישור הזמנה</h1>
      <p className="muted">מסמך זה אינו חשבונית מס. חשבונית מס תונפק בנפרד.</p>
      <p>מספר הזמנה: <b style={{ direction: "ltr", display: "inline-block" }}>{o.number}</b><br />תאריך: {o.createdAt.toLocaleDateString("he-IL")}</p>
      <p><b>{o.company}</b>{o.taxId && ` · ח.פ. ${o.taxId}`}<br />{o.customerName} · {o.email} · {o.phone}<br />{o.address}</p>
      <table className="plain">
        <thead><tr><th>פריט</th><th>כמות</th><th>מחיר ליחידה</th><th>סה״כ</th></tr></thead>
        <tbody>{o.items.map((i) => (<tr key={i.id}><td>{i.name}</td><td>{i.qty}</td><td>{formatILS(i.unitPrice)}</td><td>{formatILS(i.unitPrice * i.qty)}</td></tr>))}</tbody>
      </table>
      <div className="sum-row"><span>לפני מע״מ</span><span>{formatILS(o.subtotal)}</span></div>
      <div className="sum-row"><span>מע״מ 18%</span><span>{formatILS(o.vat)}</span></div>
      <div className="sum-row total"><span>סה״כ לתשלום</span><span>{formatILS(o.total)}</span></div>
      {o.eventDate && <p>מועד אספקה רצוי: {o.eventDate}</p>}
      {o.notes && <p>הערות: {o.notes}</p>}
    </div>
  );
}
