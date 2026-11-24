import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatILS } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export default async function OrderDone({ params }: { params: { number: string } }) {
  const o = await db.order.findUnique({ where: { number: params.number }, include: { items: true } });
  if (!o) notFound();
  return (
    <>
      <h1>תודה, ההזמנה התקבלה</h1>
      <p>מספר הזמנה: <b>{o.number}</b>. נחזור אליכם לאישור, חשבונית ותשלום בכתובת {o.email}.</p>
      <table>
        <thead><tr><th>מוצר</th><th>כמות</th><th>ליחידה</th></tr></thead>
        <tbody>{o.items.map((i) => (<tr key={i.id}><td>{i.name}</td><td>{i.qty}</td><td>{formatILS(i.unitPrice)}</td></tr>))}</tbody>
      </table>
      <p>סה״כ כולל מע״מ: <b>{formatILS(o.total)}</b></p>
      <Link className="btn" href="/">חזרה לחנות</Link>
    </>
  );
}
