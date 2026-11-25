import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import ProductGallery from "@/components/ProductGallery";
import AddToCart from "@/components/AddToCart";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const p = await db.product.findUnique({ where: { slug: params.slug } });
  if (!p || !p.active) return {};
  return { title: p.name, description: p.description.slice(0, 160) || `${p.name} בכמויות, עם מחיר יורד לפי כמות` };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const p = await db.product.findUnique({ where: { slug: params.slug }, include: { tiers: { orderBy: { minQty: "asc" } } } });
  if (!p || !p.active) notFound();

  return (
    <div className="wrap">
      <div className="crumbs"><Link href="/">קטלוג</Link> / <Link href={`/?category=${encodeURIComponent(p.category)}#catalog`}>{p.category}</Link> / {p.name}</div>
      <div className="pdp">
        <div>
          <ProductGallery slug={p.slug} category={p.category} imageUrl={p.imageUrl} />
          <span className="eyebrow" style={{ marginTop: 28 }}>{p.category}</span>
          <h1 style={{ fontSize: "clamp(1.9rem,4vw,2.8rem)" }}>{p.name}</h1>
          <p className="muted" style={{ fontSize: "1.1rem" }}>{p.description}</p>
          <div className="facts">
            <div className="fact"><b>כמות מינימום</b>{p.minQty} יחידות</div>
            {p.branding && <div className="fact"><b>שיטות מיתוג</b>{p.branding}</div>}
            {p.leadTime && <div className="fact"><b>זמן אספקה</b>{p.leadTime} <span className="muted">(מאישור הדמיה)</span></div>}
          </div>
          <p className="muted">צריכים כמות גדולה יותר או התאמה מיוחדת? <Link href={`/quote?product=${encodeURIComponent(p.name)}`} style={{ textDecoration: "underline", fontWeight: 700 }}>בקשו הצעת מחיר</Link>, או <Link href={`/quote?kind=sample&product=${encodeURIComponent(p.name)}`} style={{ textDecoration: "underline", fontWeight: 700 }}>הזמינו דוגמית</Link>.</p>
        </div>
        <AddToCart
          productId={p.id}
          slug={p.slug}
          name={p.name}
          basePrice={p.basePrice}
          minQty={p.minQty}
          tiers={p.tiers.map((t) => ({ minQty: t.minQty, unitPrice: t.unitPrice }))}
        />
      </div>
    </div>
  );
}
