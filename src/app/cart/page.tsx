"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import ProductArt from "@/components/ProductArt";
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

  if (lines.length === 0) {
    return (
      <div className="wrap empty">
        <div className="art-empty" aria-hidden>🛒</div>
        <h1 style={{ fontSize: "2.2rem" }}>העגלה ריקה</h1>
        <p className="muted">בחרו מוצרים מהקטלוג והוסיפו כמות.</p>
        <Link className="btn" href="/#catalog">לקטלוג</Link>
      </div>
    );
  }

  return (
    <div className="wrap">
      <h1 style={{ fontSize: "clamp(1.9rem,4vw,2.6rem)", marginTop: 28 }}>העגלה שלכם</h1>
      <div className="stepper" aria-label="שלבי הזמנה">
        <span className="on"><i>1</i> עגלה ופרטים</span><em /><span><i>2</i> אישור מצדנו</span><em /><span><i>3</i> חשבונית ותשלום</span>
      </div>
      <div className="cart-grid">
        <div>
          {lines.map((l) => {
            const q = quote?.lines.find((x) => x.productId === l.productId);
            return (
              <div className="line" key={l.productId}>
                <ProductArt slug={l.slug} compact />
                <div className="line-main">
                  <div className="line-top">
                    <b>{l.name}</b>
                    <b>{q ? formatILS(q.lineTotal) : "…"}</b>
                  </div>
                  {q?.error && <span className="error">{q.error}</span>}
                  <div className="line-ctl">
                    <label style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                      כמות
                      <input type="number" min={1} value={l.qty || ""} onChange={(e) => setQty(l.productId, parseInt(e.target.value, 10) || 0)} />
                    </label>
                    <span className="muted">{q ? `${formatILS(q.unitPrice)} ליחידה` : ""}</span>
                    <button className="linkbtn" onClick={() => remove(l.productId)}>הסרה</button>
                  </div>
                </div>
              </div>
            );
          })}

          <form id="order-form" onSubmit={submit} className="panel" style={{ marginTop: 24 }}>
            <h2 style={{ fontSize: "1.5rem" }}>פרטים להזמנה</h2>
            <p className="muted">ההזמנה נשלחת אלינו לאישור. אין חיוב באתר.</p>
            <div className="row">
              <div><label htmlFor="customerName">שם איש קשר *</label><input id="customerName" name="customerName" autoComplete="name" required /></div>
              <div><label htmlFor="company">שם החברה *</label><input id="company" name="company" autoComplete="organization" required /></div>
              <div><label htmlFor="taxId">ח.פ. / עוסק מורשה</label><input id="taxId" name="taxId" inputMode="numeric" /></div>
            </div>
            <div className="row">
              <div><label htmlFor="email">אימייל *</label><input id="email" name="email" type="email" autoComplete="email" required /></div>
              <div><label htmlFor="phone">טלפון *</label><input id="phone" name="phone" type="tel" autoComplete="tel" required /></div>
            </div>
            <label htmlFor="address">כתובת למשלוח *</label><input id="address" name="address" autoComplete="street-address" required />
            <label htmlFor="eventDate">תאריך אירוע / מועד אספקה רצוי</label><input id="eventDate" name="eventDate" type="date" />
            <label htmlFor="notes">הערות (עיצוב לוגו, התאמות וכו׳)</label><textarea id="notes" name="notes" rows={3} />
          </form>
        </div>

        <aside className="panel summary">
          <h3>סיכום הזמנה</h3>
          <div className="sum-row"><span>סכום ביניים</span><span>{quote ? formatILS(quote.subtotal) : "…"}</span></div>
          <div className="sum-row"><span>מע״מ 18%</span><span>{quote ? formatILS(quote.vat) : "…"}</span></div>
          <div className="sum-row total"><span>סה״כ</span><span>{quote ? formatILS(quote.total) : "…"}</span></div>
          {err && <p className="error">{err}</p>}
          <button className="btn block" form="order-form" disabled={busy || !quote?.ok} style={{ marginTop: 14 }}>{busy ? "שולח…" : "שליחת הזמנה"}</button>
          <p className="muted" style={{ fontSize: ".85rem", margin: "12px 0 0" }}>נחזור אליכם עם אישור, חשבונית וקישור לתשלום.</p>
        </aside>
      </div>
    </div>
  );
}
