#!/usr/bin/env node
/**
 * בנייה ל-Vercel: מייצר את לקוח Prisma, מסנכרן את הסכמה למסד הנתונים, ואז בונה את האתר.
 * מזהה כתובת Postgres בכל שם משתנה (DATABASE_URL, POSTGRES_*, קידומת מותאמת וכו'),
 * ולסנכרון הסכמה משתמש בחיבור הישיר (בלי pooler) אם קיים.
 * (הלוגיקה משוכפלת מ-src/lib/dburl.ts כי הסקריפט הזה רץ לפני הקומפילציה.)
 */
const { spawnSync } = require("child_process");
const env = { ...process.env };
const PG = /^postgres(ql)?:\/\//i;
const DIRECT = /(UNPOOLED|NON_POOLING|DIRECT)/i;
const entries = Object.entries(env).filter(([, v]) => typeof v === "string" && PG.test(v));

function runtimeUrl() {
  for (const k of ["DATABASE_URL", "POSTGRES_PRISMA_URL", "POSTGRES_URL"]) if (env[k] && PG.test(env[k])) return env[k];
  return (entries.find(([k]) => !DIRECT.test(k)) || entries[0] || [, ""])[1];
}
function directUrl() {
  for (const k of ["DIRECT_URL", "POSTGRES_URL_NON_POOLING", "DATABASE_URL_UNPOOLED"]) if (env[k] && PG.test(env[k])) return env[k];
  return (entries.find(([k]) => DIRECT.test(k)) || [, ""])[1] || runtimeUrl();
}

const rt = runtimeUrl();
if (!rt) {
  const names = Object.keys(env).filter((k) => /(POSTGRES|DATABASE|NEON|SUPABASE|PGHOST|DB_URL)/i.test(k)).sort();
  console.error("\n❌ לא נמצאה כתובת למסד הנתונים (משתנה שערכו מתחיל ב-postgres:// או postgresql://).");
  console.error(names.length ? `משתנים שנראים קשורים למסד ושקיימים בבנייה הזו (שמות בלבד): ${names.join(", ")}` : "אין בבנייה הזו אף משתנה שקשור למסד. ודאו שהמשתנים מוגדרים ל-Production ב-Settings ← Environment Variables, ושעשיתם Redeploy אחרי שהוספתם אותם.");
  console.error("הגדירו DATABASE_URL (או חברו Postgres דרך Storage ב-Vercel) ופרסו מחדש.\n");
  process.exit(1);
}
const direct = directUrl();
console.log(`→ נמצאה כתובת מסד. חיבור ישיר לסנכרון: ${direct !== rt ? "כן" : "לא (אותה כתובת)"}`);

function run(cmd, args, extraEnv = {}) {
  const r = spawnSync(cmd, args, { stdio: "inherit", env: { ...env, ...extraEnv }, shell: process.platform === "win32" });
  if (r.status !== 0) process.exit(r.status || 1);
}
run("npx", ["prisma", "generate"], { DATABASE_URL: rt });
console.log("→ מסנכרן את הסכמה למסד הנתונים (prisma db push)…");
run("npx", ["prisma", "db", "push", "--skip-generate"], { DATABASE_URL: direct });
run("npx", ["next", "build"], { DATABASE_URL: rt });
