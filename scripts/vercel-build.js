#!/usr/bin/env node
/**
 * בנייה ל-Vercel: מייצר את לקוח Prisma, מסנכרן את הסכמה למסד הנתונים, ואז בונה את האתר.
 * מזהה גם את המשתנים שאינטגרציית Postgres של Vercel/Neon מגדירה (POSTGRES_*), בנוסף ל-DATABASE_URL.
 * לסנכרון הסכמה משתמשים בחיבור הישיר (בלי pooler) אם קיים.
 */
const { spawnSync } = require("child_process");
const env = { ...process.env };
const runtimeUrl = env.DATABASE_URL || env.POSTGRES_PRISMA_URL || env.POSTGRES_URL;
const directUrl = env.DIRECT_URL || env.POSTGRES_URL_NON_POOLING || runtimeUrl;

function run(cmd, args, extraEnv = {}) {
  const r = spawnSync(cmd, args, { stdio: "inherit", env: { ...env, ...extraEnv }, shell: process.platform === "win32" });
  if (r.status !== 0) process.exit(r.status || 1);
}

if (!runtimeUrl) {
  console.error("\n❌ לא נמצאה כתובת למסד הנתונים. הגדירו DATABASE_URL (או חברו Postgres דרך Storage ב-Vercel) ופרסו מחדש.\n");
  process.exit(1);
}
run("npx", ["prisma", "generate"], { DATABASE_URL: runtimeUrl });
console.log("→ מסנכרן את הסכמה למסד הנתונים (prisma db push)…");
run("npx", ["prisma", "db", "push", "--skip-generate"], { DATABASE_URL: directUrl });
run("npx", ["next", "build"], { DATABASE_URL: runtimeUrl });
