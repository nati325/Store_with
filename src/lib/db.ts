import { PrismaClient } from "@prisma/client";
import { runtimeDbUrl } from "./dburl";

/** כתובת המסד: DATABASE_URL, המשתנים של אינטגרציית Postgres של Vercel/Neon, או כל משתנה אחר שערכו כתובת Postgres. */
export const databaseUrl = runtimeDbUrl(process.env);

const g = globalThis as unknown as { prisma?: PrismaClient };
export const db = g.prisma ?? new PrismaClient(databaseUrl ? { datasourceUrl: databaseUrl } : undefined);
if (process.env.NODE_ENV !== "production") g.prisma = db;
