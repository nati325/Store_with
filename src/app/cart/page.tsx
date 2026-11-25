"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import ProductArt from "@/components/ProductArt";
import { formatILS } from "@/lib/pricing";

type Quote = { lines: { productId: number; name: string; qty: number; unitPrice: number; lineTotal: number; minQty: number; leadTime?: string; error?: string }[]; subtotal: number; vat: number; total: number; ok: boolean };

export default function CartPage() {
  const { lines, setQty, remove, clear } = useCart();
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  const [logoErr, setLogoErr] = useState("");
  const [logoBusy, setLogoBusy] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // מילוי אוטומטי של פרטי חברה מהזמנה קודמת (נשמר בדפדפן בלבד)
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("bulk-shop-contact") || "{}");
      const f = formRef.current;
      if (f) for (const [k, v] of Object.entries(saved)) { const el = f.elements.namedItem(k) as HTMLInputElement | null; if (el && !el.value && typeof v === "string") el.value = v; }
    } catch {}
  }, [lines.length]);

  async function uploadLogo(file: File | undefined) {
    if (!file) return;
    setLogoErr(""); setLogoBusy(true);
    const fd = new FormData(); fd.append("file", file);
    const res = await fetch("/api/logo", { method: "POST", body: fd });
    const json = await res.json().catch(() => ({}));
    setLogoBusy(false);
    if (!res.ok) { setLogoErr(json.error ?? "שגיאה בהעלאה"); return; }
    setLogoUrl(json.url);
  }

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
    const res = await fetch("/api/orders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...data, logoUrl, lines }) });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setErr(json.error ?? "שגיאה בשליחת ההזמנה"); return; }
    try {
      const keep: Record<string, string> = {};
      for (const k of ["customerName", "company", "taxId", "email", "phone", "address"]) keep[k] = String(data[k] ?? "");
      localStorage.setItem("bulk-shop-contact", JSON.stringify(keep));
    } catch {}
    clear();
    router.push(`/order/${json.number}?t=${json.token}`);
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
                  {q?.leadTime && <span className="muted">זמן אספקה: {q.leadTime}</span>}
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

          <form id="order-form" ref={formRef} onSubmit={submit} className="panel" style={{ marginTop: 24 }}>
            <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }} />
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
            <label htmlFor="shipTo">משלוח למספר כתובות (אופציונלי): כתובת וכמות לכל אחת</label>
            <textarea id="shipTo" name="shipTo" rows={2} placeholder={"תל אביב, הרצל 1: 100 יח׳\nחיפה, הנמל 5: 50 יח׳"} />
            <label htmlFor="logo">לוגו להדפסה (אופציונלי: JPG, PNG, WEBP או GIF)</label>
            <input id="logo" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => uploadLogo(e.target.files?.[0])} />
            {logoBusy && <p className="muted">מעלה…</p>}
            {logoErr && <p className="error" role="alert">{logoErr}</p>}
            {logoUrl && (
              <p style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoUrl} alt="הלוגו שהועלה" style={{ maxHeight: 56, maxWidth: 120, objectFit: "contain", background: "var(--surface-2)", borderRadius: 8, padding: 4 }} />
                <button type="button" className="linkbtn" onClick={() => setLogoUrl("")}>הסרה</button>
              </p>
            )}
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
          <p className="muted" style={{ fontSize: ".85rem", margin: "12px 0 0" }}>נחזור אליכם עם אישור, הדמיה לאישור (אם הועלה לוגו), חשבונית וקישור לתשלום.</p>
          <Link className="btn secondary block" style={{ marginTop: 10 }} href="/cart/quote">הצעת מחיר להדפסה</Link>
        </aside>
      </div>
    </div>
  );
}
