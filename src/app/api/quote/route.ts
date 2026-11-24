import { NextResponse } from "next/server";
import { priceLines } from "@/lib/orders";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.lines)) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const lines = body.lines.slice(0, 100).map((l: any) => ({ productId: Number(l.productId), qty: Number(l.qty) }));
  return NextResponse.json(await priceLines(lines));
}
