/**
 * מזהה כתובות Postgres מתוך משתני הסביבה, בלי תלות בשם המדויק.
 * Vercel/Neon נותנים שמות שונים (DATABASE_URL, POSTGRES_URL, ...) ואפשר גם קידומת מותאמת (STORAGE_...).
 */
const PG = /^postgres(ql)?:\/\//i;
const DIRECT = /(UNPOOLED|NON_POOLING|DIRECT)/i;

type Env = Record<string, string | undefined>;
const entries = (env: Env) => Object.entries(env).filter(([, v]) => typeof v === "string" && PG.test(v)) as [string, string][];

/** כתובת לשימוש האתר בזמן ריצה (מועדף חיבור עם pooler). */
export function runtimeDbUrl(env: Env): string {
  for (const k of ["DATABASE_URL", "POSTGRES_PRISMA_URL", "POSTGRES_URL"]) if (env[k] && PG.test(env[k]!)) return env[k]!;
  const e = entries(env);
  return (e.find(([k]) => !DIRECT.test(k)) ?? e[0])?.[1] ?? "";
}

/** כתובת לסנכרון הסכמה (מועדף חיבור ישיר, בלי pooler). */
export function directDbUrl(env: Env): string {
  for (const k of ["DIRECT_URL", "POSTGRES_URL_NON_POOLING", "DATABASE_URL_UNPOOLED"]) if (env[k] && PG.test(env[k]!)) return env[k]!;
  return entries(env).find(([k]) => DIRECT.test(k))?.[1] ?? runtimeDbUrl(env);
}

/** שמות (בלבד) של משתנים שנראים קשורים למסד, לאבחון. */
export function dbLikeNames(env: Env): string[] {
  return Object.keys(env).filter((k) => /(POSTGRES|DATABASE|NEON|SUPABASE|PGHOST|DB_URL)/i.test(k)).sort();
}
