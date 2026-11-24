"use client";
import { useState } from "react";
import Link from "next/link";

export default function QuotePage() {
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(""); setState("busy");
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    const res = await fetch("/api/quotes", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { setErr(json.error ?? "שגיאה בשליחה"); setState("idle"); return; }
    setState("done");
  }

  if (state === "done") {
    return (
      <div className="wrap done">
        <div className="check" aria-hidden>✓</div>
        <h1 style={{ fontSize: "2.4rem" }}>הבקשה התקבלה</h1>
        <p className="muted">נחזור אליכם עם הצעת מחיר בהקדם.</p>
        <Link className="btn" href="/">חזרה לחנות</Link>
      </div>
    );
  }
  return (
    <div className="wrap" style={{ maxWidth: 760, paddingBottom: 64 }}>
      <h1 style={{ fontSize: "clamp(1.9rem,4vw,2.6rem)", marginTop: 32 }}>בקשת הצעת מחיר</h1>
      <p className="muted">כמות גדולה במיוחד, מוצר מיוחד או התאמה אישית? ספרו לנו מה אתם צריכים.</p>
      <form onSubmit={submit} className="panel">
        <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }} />
        <div className="row">
          <div><label htmlFor="name">שם איש קשר *</label><input id="name" name="name" autoComplete="name" required /></div>
          <div><label htmlFor="company">שם החברה *</label><input id="company" name="company" autoComplete="organization" required /></div>
        </div>
        <div className="row">
          <div><label htmlFor="email">אימייל *</label><input id="email" name="email" type="email" autoComplete="email" required /></div>
          <div><label htmlFor="phone">טלפון *</label><input id="phone" name="phone" type="tel" autoComplete="tel" required /></div>
        </div>
        <label htmlFor="product">מוצר מבוקש</label><input id="product" name="product" />
        <label htmlFor="message">פרטי הבקשה (כמות, מועד, התאמות) *</label><textarea id="message" name="message" rows={5} required />
        {err && <p className="error">{err}</p>}
        <p style={{ marginTop: 16 }}><button className="btn" disabled={state === "busy"}>{state === "busy" ? "שולח…" : "שליחת בקשה"}</button></p>
      </form>
    </div>
  );
}
