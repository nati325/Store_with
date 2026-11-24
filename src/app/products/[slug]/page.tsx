import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatILS } from "@/lib/pricing";
import AddToCart from "@/components/AddToCart";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const p = await db.product.findUnique({ where: { slug: params.slug }, include: { tiers: { orderBy: { minQty: "asc" } } } });
  if (!p || !p.active) notFound();

  return (
    <>
      <h1>{p.name}</h1>
      <p className="muted">{p.category}</p>
      <p>{p.description}</p>
      <div className="row">
        <div>
          <h3>מחירי כמות (ללא מע״מ)</h3>
          <table>
            <thead><tr><th>כמות</th><th>מחיר ליחידה</th></tr></thead>
            <tbody>
              <tr><td>{p.minQty}+</td><td>{formatILS(p.basePrice)}</td></tr>
              {p.tiers.map((t) => (<tr key={t.id}><td>{t.minQty}+</td><td>{formatILS(t.unitPrice)}</td></tr>))}
            </tbody>
          </table>
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
    </>
  );
}
