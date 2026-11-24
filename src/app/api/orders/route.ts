import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { priceLines } from "@/lib/orders";

const REQUIRED = ["customerName", "company", "email", "phone", "address"] as const;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
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
  return NextResponse.json({ number: order.number });
}
