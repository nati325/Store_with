import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { newToken } from "@/lib/orderMail";
import { formatILS } from "@/lib/pricing";

export const dynamic = "force-dynamic";

async function create(fd: FormData) {
  "use server";
  requireAdmin();
  const company = String(fd.get("company") ?? "").trim();
  const budget = Math.round(parseFloat(String(fd.get("budget"))) * 100);
  if (!company || !(budget > 0)) redirect("/admin/programs?error=" + encodeURIComponent("נא למלא שם חברה ותקציב תקין"));
  const d = String(fd.get("deadline") ?? "");
  const p = await db.giftProgram.create({
    data: { token: newToken(), company, budget, contactEmail: String(fd.get("contactEmail") ?? "").trim().slice(0, 160), message: String(fd.get("message") ?? "").trim().slice(0, 1000), deadline: d ? new Date(d + "T23:59:59") : null },
  });
  revalidatePath("/admin/programs");
  redirect(`/admin/programs/${p.id}`);
}

export default async function Programs({ searchParams }: { searchParams: { error?: string } }) {
  requireAdmin();
  const list = await db.giftProgram.findMany({ orderBy: { id: "desc" }, include: { _count: { select: { choices: true } } } });
  return (
    <>
      <h1 style={{ fontSize: "2rem" }}>העובד בוחר</h1>
      <p className="muted">יוצרים קישור פרטי לחברה עם תקציב לעובד. כל עובד נכנס, בוחר מתנה אחת מהקטלוג בתוך התקציב ומשאיר כתובת. בסוף מייצאים סיכום ומזמינים.</p>
      {searchParams.error && <p className="error" role="alert">{searchParams.error}</p>}
      {list.map((p) => (
        <Link key={p.id} href={`/admin/programs/${p.id}`} className="ocard" style={{ gridTemplateColumns: "1fr auto auto" }}>
          <div><b>{p.company}</b> <span className="status" data-s={p.status === "OPEN" ? "PAID" : "CANCELLED"}>{p.status === "OPEN" ? "פתוחה" : "סגורה"}</span>
            <div className="muted">תקציב לעובד: {formatILS(p.budget)}{p.deadline && ` · עד ${p.deadline.toLocaleDateString("he-IL")}`}</div></div>
          <span>{p._count.choices} בחירות</span><span className="muted">פרטים ←</span>
        </Link>
      ))}
      {list.length === 0 && <p className="muted">אין תוכניות עדיין.</p>}
      <h2 style={{ marginTop: 32 }}>תוכנית חדשה</h2>
      <form action={create} className="panel admin-form">
        <div className="row">
          <div><label htmlFor="company">שם החברה *</label><input id="company" name="company" required /></div>
          <div><label htmlFor="budget">תקציב מקסימלי לעובד (₪, ללא מע״מ) *</label><input id="budget" name="budget" type="number" min="1" step="0.01" required /></div>
        </div>
        <p className="muted" style={{ margin: "6px 0 0" }}>העובדים יראו מוצרים שמחיר הבסיס שלהם עד התקציב.</p>
        <div className="row">
          <div><label htmlFor="contactEmail">אימייל איש קשר בחברה</label><input id="contactEmail" name="contactEmail" type="email" dir="ltr" /></div>
          <div><label htmlFor="deadline">מועד אחרון לבחירה</label><input id="deadline" name="deadline" type="date" /></div>
        </div>
        <label htmlFor="message">הודעה לעובדים</label><textarea id="message" name="message" rows={3} placeholder="לקראת החג, בחרו מתנה לבחירתכם." />
        <p><button className="btn">יצירת קישור</button></p>
      </form>
    </>
  );
}
