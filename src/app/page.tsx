import Link from "next/link";
import { db } from "@/lib/db";
import { formatILS } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: { category?: string } }) {
  const all = await db.product.findMany({ where: { active: true }, include: { tiers: true }, orderBy: { id: "asc" } });
  const categories = Array.from(new Set(all.map((p) => p.category).filter(Boolean)));
  const products = searchParams.category ? all.filter((p) => p.category === searchParams.category) : all;

  return (
    <>
      <h1>מתנות ומוצרי מותג לחברות ואירועים</h1>
      <p className="muted">ככל שמזמינים יותר, המחיר ליחידה יורד. כל המחירים ללא מע״מ.</p>
      <div className="chips">
        <Link className="btn secondary" href="/">הכל</Link>
        {categories.map((c) => (
          <Link key={c} className="btn secondary" href={`/?category=${encodeURIComponent(c)}`}>{c}</Link>
        ))}
      </div>
      <div className="grid">
        {products.map((p) => {
          const lowest = Math.min(p.basePrice, ...p.tiers.map((t) => t.unitPrice));
          return (
            <Link key={p.id} href={`/products/${p.slug}`} style={{ textDecoration: "none" }}>
              <div className="card">
                <span className="badge">{p.category}</span>
                <h3>{p.name}</h3>
                <div className="muted">מינימום הזמנה: {p.minQty} יח׳</div>
                <div className="price">החל מ-{formatILS(lowest)} ליחידה</div>
              </div>
            </Link>
          );
        })}
        {products.length === 0 && <p>אין מוצרים להצגה.</p>}
      </div>
    </>
  );
}
