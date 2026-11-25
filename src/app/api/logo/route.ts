import { NextResponse } from "next/server";
import { saveImage } from "@/lib/uploads";
import { allow, clientIp } from "@/lib/ratelimit";

/** העלאת לוגו של לקוח להדפסה. פתוח לציבור, מוגבל בקצב ובסוג קובץ. */
export async function POST(req: Request) {
  if (!allow("logo:" + clientIp(req), 10, 60 * 60 * 1000)) return NextResponse.json({ error: "יותר מדי העלאות. נסו שוב מאוחר יותר" }, { status: 429 });
  const fd = await req.formData().catch(() => null);
  const f = fd?.get("file");
  if (!(f instanceof File) || f.size === 0) return NextResponse.json({ error: "לא נבחר קובץ" }, { status: 400 });
  try {
    return NextResponse.json({ url: await saveImage(f) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
