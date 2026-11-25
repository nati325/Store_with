import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { allow, clientIp } from "@/lib/ratelimit";
import { sendMail, siteUrl } from "@/lib/mail";

export async function POST(req: Request) {
  if (!allow("quote:" + clientIp(req), 5, 60 * 60 * 1000)) return NextResponse.json({ error: "יותר מדי ניסיונות. נסו שוב מאוחר יותר" }, { status: 429 });
  const b = await req.json().catch(() => null);
  if (!b) return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
  if (typeof b.website === "string" && b.website) return NextResponse.json({ ok: true });
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const d = { name: str(b.name, 120), company: str(b.company, 120), email: str(b.email, 160), phone: str(b.phone, 30), message: str(b.message, 2000), product: str(b.product, 160), kind: b.kind === "SAMPLE" ? "SAMPLE" : "QUOTE" };
  if (!d.name || !d.company || !d.phone || !d.message) return NextResponse.json({ error: "יש למלא את כל שדות החובה" }, { status: 400 });
  if (!/^\S+@\S+\.\S+$/.test(d.email)) return NextResponse.json({ error: "כתובת אימייל לא תקינה" }, { status: 400 });
  await db.quoteRequest.create({ data: d });
  await Promise.all([
    sendMail({ to: d.email, subject: d.kind === "SAMPLE" ? "קיבלנו את בקשת הדוגמית" : "קיבלנו את בקשת הצעת המחיר", text: `שלום ${d.name},\n\nקיבלנו את הבקשה ונחזור אליכם בהקדם.` }),
    sendMail({ to: process.env.ADMIN_EMAIL || "", subject: `${d.kind === "SAMPLE" ? "בקשת דוגמית" : "בקשת הצעת מחיר"} מ-${d.company}`, text: `${d.name} (${d.company})\n${d.email} ${d.phone}\nמוצר: ${d.product}\n\n${d.message}\n\n${siteUrl()}/admin/quotes` }),
  ]);
  return NextResponse.json({ ok: true });
}
