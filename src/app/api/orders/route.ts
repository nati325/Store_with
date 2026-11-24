import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { priceLines } from "@/lib/orders";
import { allow, clientIp } from "@/lib/ratelimit";
import { sendMail, siteUrl } from "@/lib/mail";
import { formatILS } from "@/lib/pricing";

const REQUIRED = ["customerName", "company", "email", "phone", "address"] as const;

export async function POST(req: Request) {
  if (!allow("order:" + clientIp(req), 10, 60 * 60 * 1000)) return NextResponse.json({ error: "יותר מדי ניסיונות. נסו שוב מאוחר יותר" }, { status: 429 });
  const body = await req.json().catch(() => null);
  // שדה פיתיון נגד בוטים: אנשים לא ממלאים אותו
  if (body && typeof body.website === "string" && body.website) return NextResponse.json({ number: "BS-OK" });
  if (!body || !Array.isArray(body.lines)) return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });

  for (const f of REQUIRED) {
    if (typeof body[f] !== "string" || !body[f].trim()) return NextResponse.json({ error: "יש למלא את כל שדות החובה" }, { status: 400 });
  }
  if (!/^\S+@\S+\.\S+$/.test(body.email)) return NextResponse.json({ error: "כתובת אימייל לא תקינה" }, { status: 400 });

  const input = body.lines.slice(0, 100).map((l: any) => ({ productId: Number(l.productId), qty: Number(l.qty) }));
  const priced = await priceLines(input);
  if (!priced.ok) return NextResponse.json({ error: "העגלה מכילה פריטים לא תקינים" }, { status: 400 });

  const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const number = "BS-" + Date.now().toString(36).toUpperCase() + Math.floor(Math.random() * 36 ** 2).toString(36).toUpperCase().padStart(2, "0");

  const order = await db.order.create({
    data: {
      number,
      customerName: str(body.customerName, 120),
      company: str(body.company, 120),
      taxId: str(body.taxId, 20),
      email: str(body.email, 160),
      phone: str(body.phone, 30),
      address: str(body.address, 300),
      eventDate: str(body.eventDate, 40),
      notes: str(body.notes, 1000),
      subtotal: priced.subtotal,
      vat: priced.vat,
      total: priced.total,
      items: { create: priced.lines.map((l) => ({ productId: l.productId, name: l.name, qty: l.qty, unitPrice: l.unitPrice })) },
    },
  });
  const itemsText = priced.lines.map((l) => `- ${l.name} × ${l.qty} (${formatILS(l.unitPrice)} ליחידה)`).join("\n");
  const link = `${siteUrl()}/order/${order.number}`;
  await Promise.all([
    sendMail({ to: order.email, subject: `קיבלנו את ההזמנה ${order.number}`, text: `שלום ${order.customerName},\n\nההזמנה התקבלה ותיבדק על ידינו.\n\n${itemsText}\n\nסה״כ כולל מע״מ: ${formatILS(order.total)}\n\nמעקב אחר ההזמנה: ${link}` }),
    sendMail({ to: process.env.ADMIN_EMAIL || "", subject: `הזמנה חדשה ${order.number} מ-${order.company}`, text: `${order.company} / ${order.customerName}\n${order.email} ${order.phone}\n\n${itemsText}\n\nסה״כ: ${formatILS(order.total)}\n${siteUrl()}/admin/orders/${order.id}` }),
  ]);
  return NextResponse.json({ number: order.number });
}
