import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const products = await db.product.findMany({ where: { active: true }, select: { slug: true } });
  const campaigns = await db.campaign.findMany({ where: { active: true }, select: { slug: true } });
  return [
    { url: base + "/" }, { url: base + "/quote" },
    ...campaigns.map((c) => ({ url: `${base}/holidays/${c.slug}` })),
    ...products.map((p) => ({ url: `${base}/products/${p.slug}` })),
  ];
}
