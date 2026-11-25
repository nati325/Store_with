import { db } from "@/lib/db";
import { syncPayment } from "@/lib/cardcom";
import { allow, clientIp } from "@/lib/ratelimit";

/**
 * התראת Cardcom על סיום תשלום. אנחנו לא סומכים על תוכן ההודעה: רק מזהה דף התשלום נלקח ממנה,
 * והתשלום עצמו מאומת בשרת מול Cardcom (GetLpResult) ומשווה להזמנה ולסכום.
 */
export async function POST(req: Request) {
  if (!allow("cc-hook:" + clientIp(req), 120, 60 * 1000)) return new Response("rate limited", { status: 429 });
  let id = "";
  try {
    const ct = req.headers.get("content-type") || "";
    const body: Record<string, unknown> = ct.includes("json") ? await req.json() : Object.fromEntries((await req.formData()).entries());
    const key = Object.keys(body).find((k) => k.toLowerCase() === "lowprofileid");
    id = key ? String(body[key]) : "";
  } catch {}
  if (!/^[0-9a-fA-F-]{16,64}$/.test(id)) return Response.json({ ok: true }); // תשובה אחידה, בלי לחשוף מידע
  const o = await db.order.findFirst({ where: { lowProfileId: id }, select: { id: true } });
  if (o) await syncPayment(o.id);
  return Response.json({ ok: true });
}
