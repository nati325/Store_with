import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import ProductCard from "@/components/ProductCard";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const c = await db.campaign.findUnique({ where: { slug: params.slug } });
  return c && c.active ? { title: c.title, description: c.intro.slice(0, 160) } : {};
}

export default async function Holiday({ params }: { params: { slug: string } }) {
  const c = await db.campaign.findUnique({ where: { slug: params.slug } });
  if (!c || !c.active) notFound();
  const all = await db.product.findMany({ where: { active: true }, include: { tiers: true }, orderBy: { id: "asc" } });
  const products = all.filter((p) => p.tags.split(",").includes(c.tag));
  const daysLeft = c.deadline ? Math.ceil((c.deadline.getTime() - Date.now()) / 86400000) : null;
  return (
    <div className="wrap" style={{ paddingBottom: 64 }}>
      <div className="crumbs"><Link href="/">ראשי</Link> / {c.title}</div>
      <h1 style={{ fontSize: "clamp(2rem,5vw,3.2rem)" }}>{c.title}</h1>
      {c.intro && <p className="lead muted" style={{ fontSize: "1.15rem", maxWidth: 720 }}>{c.intro}</p>}
      {c.deadline && (
        <p className={daysLeft !== null && daysLeft < 0 ? "error" : "notice-soft"}>
          {daysLeft !== null && daysLeft < 0
            ? "המועד המומלץ להזמנה עבר. אפשר לפנות אלינו לבדיקת זמינות."
            : `כדי להספיק עד החג, מומלץ להזמין עד ${c.deadline.toLocaleDateString("he-IL")}${daysLeft !== null ? ` (עוד ${daysLeft} ימים)` : ""}. זמן האספקה נספר מאישור ההדמיה.`}
        </p>
      )}
      <div className="grid" style={{ marginTop: 24 }}>
        {products.map((p) => (<ProductCard key={p.id} p={p} />))}
      </div>
      {products.length === 0 && <p className="muted">עדיין לא נבחרו מוצרים לקמפיין הזה. <Link href="/quote" style={{ textDecoration: "underline" }}>אפשר לבקש הצעת מחיר</Link>.</p>}
    </div>
  );
}
