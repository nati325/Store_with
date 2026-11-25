import { PrismaClient } from "@prisma/client";

/** כתובת המסד: DATABASE_URL, או המשתנים שאינטגרציית Postgres של Vercel/Neon מגדירה אוטומטית. */
export const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL || "";

const g = globalThis as unknown as { prisma?: PrismaClient };
export const db = g.prisma ?? new PrismaClient(databaseUrl ? { datasourceUrl: databaseUrl } : undefined);
if (process.env.NODE_ENV !== "production") g.prisma = db;
