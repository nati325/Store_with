import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

const clean = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

async function create(fd: FormData) {
  "use server";
  requireAdmin();
  const slug = clean(String(fd.get("slug") ?? ""));
  const tag = clean(String(fd.get("tag") ?? ""));
  const title = String(fd.get("title") ?? "").trim();
  if (!slug || !tag || !title) redirect("/admin/campaigns?error=" + encodeURIComponent("נא למלא כותרת, מזהה ותגית"));
  if (await db.campaign.findUnique({ where: { slug } })) redirect("/admin/campaigns?error=" + encodeURIComponent("המזהה כבר קיים"));
  const d = String(fd.get("deadline") ?? "");
  await db.campaign.create({ data: { slug, tag, title, intro: String(fd.get("intro") ?? "").trim().slice(0, 1000), deadline: d ? new Date(d) : null } });
  revalidatePath("/admin/campaigns");
  redirect("/admin/campaigns");
}
async function toggle(fd: FormData) {
  "use server";
  requireAdmin();
  const id = Number(fd.get("id"));
  const c = await db.campaign.findUnique({ where: { id } });
  if (c) await db.campaign.update({ where: { id }, data: { active: !c.active } });
  revalidatePath("/admin/campaigns");
}
async function remove(fd: FormData) {
  "use server";
  requireAdmin();
  await db.campaign.delete({ where: { id: Number(fd.get("id")) } });
  revalidatePath("/admin/campaigns");
}

export default async function AdminCampaigns({ searchParams }: { searchParams: { error?: string } }) {
  requireAdmin();
  const list = await db.campaign.findMany({ orderBy: { id: "desc" } });
  return (
    <>
      <h1 style={{ fontSize: "2rem" }}>דפי חג וקמפיינים</h1>
      <p className="muted">כל קמפיין הוא דף ציבורי שמציג את המוצרים עם אותה תגית (מוגדרת בעריכת מוצר). קמפיין פעיל מופיע גם בדף הבית.</p>
      {searchParams.error && <p className="error" role="alert">{searchParams.error}</p>}
      {list.map((c) => (
        <div className="ocard" key={c.id} style={{ gridTemplateColumns: "1fr auto auto" }}>
          <div><b>{c.title}</b> <span className="status" data-s={c.active ? "PAID" : "CANCELLED"}>{c.active ? "פעיל" : "מושבת"}</span>
            <div className="muted">/holidays/{c.slug} · תגית: {c.tag}{c.deadline && ` · עד ${c.deadline.toLocaleDateString("he-IL")}`}</div></div>
          <form action={toggle}><input type="hidden" name="id" value={c.id} /><button className="btn secondary small">{c.active ? "השבתה" : "הפעלה"}</button></form>
          <form action={remove}><input type="hidden" name="id" value={c.id} /><button className="btn secondary small">מחיקה</button></form>
        </div>
      ))}
      <h2 style={{ marginTop: 32 }}>קמפיין חדש</h2>
      <form action={create} className="panel admin-form">
        <label htmlFor="title">כותרת *</label><input id="title" name="title" placeholder="מתנות לראש השנה" required />
        <div className="row">
          <div><label htmlFor="slug">מזהה בכתובת (אנגלית) *</label><input id="slug" name="slug" placeholder="rosh-hashana" dir="ltr" required /></div>
          <div><label htmlFor="tag">תגית מוצרים *</label><input id="tag" name="tag" placeholder="rosh-hashana" dir="ltr" required /></div>
        </div>
        <label htmlFor="intro">פתיח</label><textarea id="intro" name="intro" rows={3} />
        <label htmlFor="deadline">מועד אחרון מומלץ להזמנה</label><input id="deadline" name="deadline" type="date" />
        <p><button className="btn">הוספה</button></p>
      </form>
      <p><Link href="/admin/products" className="muted">לעריכת תגיות במוצרים ←</Link></p>
    </>
  );
}
