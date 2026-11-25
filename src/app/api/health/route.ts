import { db, databaseUrl } from "@/lib/db";

export const dynamic = "force-dynamic";

/** בדיקת תקינות לאבחון פריסה. מחזיר רק מצב כללי, בלי פרטי חיבור או נתונים. */
export async function GET() {
  const checks: Record<string, string> = {
    databaseUrl: databaseUrl ? "set" : "MISSING",
    adminPassword: process.env.ADMIN_PASSWORD ? "set" : "MISSING",
    siteUrl: process.env.SITE_URL ? "set" : "missing (optional, needed for email links)",
  };
  let status = 200;
  if (!databaseUrl) {
    checks.database = "no connection string (set DATABASE_URL)";
    status = 503;
  } else {
    try {
      const n = await db.product.count();
      checks.database = "ok";
      checks.products = String(n);
    } catch (e: any) {
      status = 503;
      checks.database = e?.code === "P2021" ? "connected, but tables are missing (run prisma db push)" : e?.name === "PrismaClientInitializationError" ? "cannot connect (check connection string / SSL)" : "error";
    }
  }
  return Response.json({ ok: status === 200, checks }, { status });
}
