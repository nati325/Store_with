"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { formatILS } from "@/lib/pricing";

type Quote = { lines: { productId: number; name: string; qty: number; unitPrice: number; lineTotal: number; minQty: number; error?: string }[]; subtotal: number; vat: number; total: number; ok: boolean };

export default function CartPage() {
  const { lines, setQty, remove, clear } = useCart();
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (lines.length === 0) { setQuote(null); return; }
    const t = setTimeout(() => {
      fetch("/api/quote", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ lines }) })
        .then((r) => r.json()).then(setQuote).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [lines]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(""); setBusy(true);
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    const res = await fetch("/api/orders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...data, lines }) });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setErr(json.error ?? "שגיאה בשליחת ההזמנה"); return; }
    clear();
    router.push(`/order/${json.number}`);
  }

  if (lines.length === 0) return (<><h1>העגלה ריקה</h1><Link className="btn" href="/">לקטלוג</Link></>);

  return (
    <>
      <h1>עגלת קניות</h1>
      <table>
        <thead><tr><th>מוצר</th><th>כמות</th><th>ליחידה</th><th>סה״כ</th><th></th></tr></thead>
        <tbody>
          {lines.map((l) => {
            const q = quote?.lines.find((x) => x.productId === l.productId);
            return (
              <tr key={l.productId}>
                <td>{l.name}{q?.error && <div className="error">{q.error}</div>}</td>
                <td><input type="number" style={{ width: 90 }} value={l.qty} min={1} onChange={(e) => setQty(l.productId, parseInt(e.target.value, 10) || 0)} /></td>
                <td>{q ? formatILS(q.unitPrice) : "…"}</td>
                <td>{q ? formatILS(q.lineTotal) : "…"}</td>
                <td><button className="btn secondary" onClick={() => remove(l.productId)}>הסרה</button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {quote && (
        <p>
          לפני מע״מ: {formatILS(quote.subtotal)} · מע״מ: {formatILS(quote.vat)}<br />
          <b>סה״כ לתשלום: {formatILS(quote.total)}</b>
        </p>
      )}
      <h2>פרטים להזמנה</h2>
      <p className="muted">ההזמנה נשלחת אלינו לאישור, ונחזור אליכם עם חשבונית וקישור לתשלום. אין חיוב באתר.</p>
      <form onSubmit={submit}>
        <div className="row">
          <div><label>שם איש קשר *</label><input name="customerName" required /></div>
          <div><label>שם החברה *</label><input name="company" required /></div>
          <div><label>ח.פ. / עוסק מורשה</label><input name="taxId" /></div>
        </div>
        <div className="row">
          <div><label>אימייל *</label><input name="email" type="email" required /></div>
          <div><label>טלפון *</label><input name="phone" type="tel" required /></div>
        </div>
        <label>כתובת למשלוח *</label><input name="address" required />
        <label>תאריך אירוע / מועד אספקה רצוי</label><input name="eventDate" type="date" />
        <label>הערות (עיצוב לוגו, התאמות וכו׳)</label><textarea name="notes" rows={3} />
        {err && <p className="error">{err}</p>}
        <p><button className="btn" disabled={busy || !quote?.ok}>{busy ? "שולח…" : "שליחת הזמנה"}</button></p>
      </form>
    </>
  );
}
