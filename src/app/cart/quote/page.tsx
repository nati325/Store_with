"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import PrintButton from "@/components/PrintButton";
import { formatILS } from "@/lib/pricing";

type Quote = { lines: { productId: number; name: string; qty: number; unitPrice: number; lineTotal: number; leadTime?: string }[]; subtotal: number; vat: number; total: number; ok: boolean };

export default function CartQuote() {
  const { lines } = useCart();
  const [q, setQ] = useState<Quote | null>(null);
  const [today] = useState(() => new Date());
  const valid = new Date(today.getTime() + 14 * 86400000);

  useEffect(() => {
    if (!lines.length) return;
    fetch("/api/quote", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ lines }) }).then((r) => r.json()).then(setQ).catch(() => {});
  }, [lines]);

  if (!lines.length) return (<div className="wrap empty"><h1>העגלה ריקה</h1><Link className="btn" href="/#catalog">לקטלוג</Link></div>);
  return (
    <div className="wrap">
      <div className="doc">
        <div className="row-between no-print"><PrintButton /><Link href="/cart" className="muted">← חזרה לעגלה</Link></div>
        <h1 style={{ fontSize: "2rem" }}>הצעת מחיר</h1>
        <p className="muted">תאריך: {today.toLocaleDateString("he-IL")} · תוקף עד {valid.toLocaleDateString("he-IL")}. ההצעה אינה חשבונית מס, והמחירים לפי הכמויות שצוינו.</p>
        {!q ? <p className="muted">מחשב…</p> : (
          <>
            <table className="plain">
              <thead><tr><th>פריט</th><th>כמות</th><th>מחיר ליחידה</th><th>סה״כ</th></tr></thead>
              <tbody>{q.lines.map((l) => (<tr key={l.productId}><td>{l.name}{l.leadTime && <div className="muted">אספקה: {l.leadTime}</div>}</td><td>{l.qty}</td><td>{formatILS(l.unitPrice)}</td><td>{formatILS(l.lineTotal)}</td></tr>))}</tbody>
            </table>
            <div className="sum-row"><span>לפני מע״מ</span><span>{formatILS(q.subtotal)}</span></div>
            <div className="sum-row"><span>מע״מ 18%</span><span>{formatILS(q.vat)}</span></div>
            <div className="sum-row total"><span>סה״כ</span><span>{formatILS(q.total)}</span></div>
          </>
        )}
      </div>
    </div>
  );
}
