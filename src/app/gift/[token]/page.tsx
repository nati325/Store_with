import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { allow } from "@/lib/ratelimit";
import ProductArt from "@/components/ProductArt";
import { sendMail } from "@/lib/mail";

export const dynamic = "force-dynamic";
export const metadata = { title: "בחירת מתנה", robots: { index: false } };

async function choose(fd: FormData) {
  "use server";
  const token = String(fd.get("token") ?? "");
  const back = `/gift/${token}`;
  const ip = headers().get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (!allow("gift:" + ip, 20, 60 * 60 * 1000)) redirect(back + "?err=" + encodeURIComponent("יותר מדי ניסיונות. נסו שוב מאוחר יותר"));
  const prog = await db.giftProgram.findUnique({ where: { token } });
  if (!prog || prog.status !== "OPEN" || (prog.deadline && prog.deadline < new Date())) redirect(back);
  const name = String(fd.get("name") ?? "").trim().slice(0, 120);
  const email = String(fd.get("email") ?? "").trim().toLowerCase().slice(0, 160);
  const address = String(fd.get("address") ?? "").trim().slice(0, 300);
  const productId = Number(fd.get("productId"));
  if (!name || !/^\S+@\S+\.\S+$/.test(email) || !productId) redirect(back + "?err=" + encodeURIComponent("נא למלא שם, אימייל תקין ולבחור מתנה"));
  const product = await db.product.findFirst({ where: { id: productId, active: true, basePrice: { lte: prog.budget } } });
  if (!product) redirect(back + "?err=" + encodeURIComponent("המתנה שנבחרה אינה זמינה"));
  await db.programChoice.upsert({
    where: { programId_email: { programId: prog.id, email } },
    create: { programId: prog.id, name, email, address, productId },
    update: { name, address, productId },
  });
  await sendMail({ to: email, subject: "בחירת המתנה שלך התקבלה", text: `שלום ${name},\n\nבחרת: ${product.name}.\nאפשר לשנות את הבחירה עד המועד האחרון, דרך אותו קישור.` });
  redirect(`${back}?done=${encodeURIComponent(product.name)}`);
}

export default async function Gift({ params, searchParams }: { params: { token: string }; searchParams: { done?: string; err?: string } }) {
  const prog = await db.giftProgram.findUnique({ where: { token: params.token } });
  if (!prog) notFound();
  const closed = prog.status !== "OPEN" || (prog.deadline && prog.deadline < new Date());
  const products = closed ? [] : await db.product.findMany({ where: { active: true, basePrice: { lte: prog.budget } }, orderBy: { id: "asc" } });
  return (
    <div className="wrap" style={{ maxWidth: 960, paddingBottom: 64 }}>
      <h1 style={{ fontSize: "clamp(1.9rem,4vw,2.8rem)", marginTop: 32 }}>בחרו את המתנה שלכם</h1>
      <p className="muted" style={{ fontSize: "1.1rem" }}>{prog.company}{prog.deadline && !closed ? ` · אפשר לבחור או לשנות עד ${prog.deadline.toLocaleDateString("he-IL")}` : ""}</p>
      {prog.message && <p className="notice-soft">{prog.message}</p>}
      {searchParams.done && <p className="notice-soft" role="status" style={{ background: "var(--ok)", color: "#fff" }}>הבחירה נשמרה: {searchParams.done}. אפשר לשנות אותה עד המועד האחרון.</p>}
      {searchParams.err && <p className="error" role="alert">{searchParams.err}</p>}
      {closed ? (
        <p className="panel">הבחירה לתוכנית הזו נסגרה.</p>
      ) : (
        <form action={choose}>
          <input type="hidden" name="token" value={prog.token} />
          <div className="panel" style={{ marginBottom: 16 }}>
            <div className="row">
              <div><label htmlFor="name">שם מלא *</label><input id="name" name="name" autoComplete="name" required /></div>
              <div><label htmlFor="email">אימייל *</label><input id="email" name="email" type="email" autoComplete="email" required /></div>
            </div>
            <label htmlFor="address">כתובת למשלוח (אם לא תימסר במקום העבודה)</label><input id="address" name="address" autoComplete="street-address" />
          </div>
          <fieldset className="gift-grid" style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="muted" style={{ marginBottom: 12 }}>בחרו מתנה אחת *</legend>
            {products.map((p) => (
              <label key={p.id} className="gift-opt">
                <input type="radio" name="productId" value={p.id} required />
                <ProductArt slug={p.slug} category={p.category} imageUrl={p.imageUrl} />
                <span className="gift-name">{p.name}</span>
              </label>
            ))}
          </fieldset>
          {products.length === 0 && <p className="muted">אין כרגע מתנות זמינות בתקציב הזה.</p>}
          <p style={{ marginTop: 20 }}><button className="btn">שמירת הבחירה</button></p>
        </form>
      )}
    </div>
  );
}
