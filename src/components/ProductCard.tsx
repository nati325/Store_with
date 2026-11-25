import Link from "next/link";
import { formatILS } from "@/lib/pricing";
import ProductArt from "./ProductArt";

type P = { id: number; slug: string; name: string; category: string; imageUrl: string; basePrice: number; minQty: number; tiers: { id: number; minQty: number; unitPrice: number }[] };

export default function ProductCard({ p }: { p: P }) {
  const sorted = [...p.tiers].sort((a, b) => a.minQty - b.minQty);
  const lowest = Math.min(p.basePrice, ...p.tiers.map((t) => t.unitPrice));
  const save = Math.round((1 - lowest / p.basePrice) * 100);
  return (
    <Link href={`/products/${p.slug}`} className="pcard">
      <div className="media">
        <ProductArt slug={p.slug} category={p.category} imageUrl={p.imageUrl} />
        {save > 0 && <span className="save-badge">עד {save}% הנחה</span>}
      </div>
      <div className="pbody">
        <span className="cat">{p.category}</span>
        <h3>{p.name}</h3>
        <span className="muted">מינימום הזמנה: {p.minQty} יח׳</span>
        <div className="mini-tiers">
          {sorted.slice(0, 3).map((t) => (<span key={t.id}>{t.minQty}+ · {formatILS(t.unitPrice)}</span>))}
        </div>
        <div className="from"><span className="muted">החל מ-</span><b>{formatILS(lowest)}</b><span className="muted">ליחידה</span></div>
      </div>
    </Link>
  );
}
