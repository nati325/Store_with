import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { siteUrl } from "@/lib/mail";
import { formatILS } from "@/lib/pricing";

export const dynamic = "force-dynamic";

async function toggle(fd: FormData) {
  "use server";
  requireAdmin();
  const id = Number(fd.get("id"));
  const p = await db.giftProgram.findUnique({ where: { id } });
  if (p) await db.giftProgram.update({ where: { id }, data: { status: p.status === "OPEN" ? "CLOSED" : "OPEN" } });
  revalidatePath(`/admin/programs/${id}`);
}
async function remove(fd: FormData) {
  "use server";
  requireAdmin();
  await db.giftProgram.delete({ where: { id: Number(fd.get("id")) } });
  redirect("/admin/programs");
}

export default async function Program({ params }: { params: { id: string } }) {
  requireAdmin();
  const p = await db.giftProgram.findUnique({ where: { id: Number(params.id) }, include: { choices: { include: { product: true }, orderBy: { createdAt: "asc" } } } });
  if (!p) notFound();
  const totals = new Map<string, { name: string; n: number; base: number }>();
  for (const c of p.choices) { const t = totals.get(c.product.slug) ?? { name: c.product.name, n: 0, base: c.product.basePrice }; t.n++; totals.set(c.product.slug, t); }
  const link = `${siteUrl()}/gift/${p.token}`;
  return (
    <>
      <p><Link href="/admin/programs" className="muted">← כל התוכניות</Link></p>
      <div className="row-between">
        <h1 style={{ fontSize: "2rem", margin: 0 }}>{p.company} <span className="status" data-s={p.status === "OPEN" ? "PAID" : "CANCELLED"}>{p.status === "OPEN" ? "פתוחה" : "סגורה"}</span></h1>
        <a className="btn secondary small" href={`/admin/programs/${p.id}/export`}>ייצוא ל-CSV</a>
      </div>
      <div className="panel" style={{ marginTop: 16 }}>
        <p className="muted" style={{ margin: 0 }}>קישור לשליחה לעובדים:</p>
        <p dir="ltr" style={{ wordBreak: "break-all", fontWeight: 700 }}>{link}</p>
        <p className="muted" style={{ margin: 0 }}>תקציב לעובד: {formatILS(p.budget)}{p.deadline && ` · מועד אחרון: ${p.deadline.toLocaleDateString("he-IL")}`}</p>
      </div>
      <h2 style={{ marginTop: 24 }}>סיכום להזמנה ({p.choices.length} בחירות)</h2>
      <table className="plain panel">
        <thead><tr><th>מוצר</th><th>כמות</th></tr></thead>
        <tbody>{Array.from(totals.values()).map((t) => (<tr key={t.name}><td>{t.name}</td><td>{t.n}</td></tr>))}</tbody>
      </table>
      <h2 style={{ marginTop: 24 }}>בחירות העובדים</h2>
      <table className="plain panel">
        <thead><tr><th>עובד</th><th>אימייל</th><th>מוצר</th><th>כתובת</th></tr></thead>
        <tbody>{p.choices.map((c) => (<tr key={c.id}><td>{c.name}</td><td>{c.email}</td><td>{c.product.name}</td><td>{c.address || "—"}</td></tr>))}</tbody>
      </table>
      {p.choices.length === 0 && <p className="muted">עדיין לא נבחרו מתנות.</p>}
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <form action={toggle}><input type="hidden" name="id" value={p.id} /><button className="btn secondary">{p.status === "OPEN" ? "סגירת התוכנית" : "פתיחה מחדש"}</button></form>
        <form action={remove}><input type="hidden" name="id" value={p.id} /><button className="btn secondary">מחיקת התוכנית</button></form>
      </div>
    </>
  );
}
