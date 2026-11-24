import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { formatILS } from "@/lib/pricing";
import ProductFields from "@/components/ProductForm";
import { createProduct } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminProducts({ searchParams }: { searchParams: { error?: string } }) {
  requireAdmin();
  const products = await db.product.findMany({ orderBy: { id: "asc" } });
  return (
    <>
      <h1 style={{ fontSize: "2rem" }}>מוצרים</h1>
      {searchParams.error && <p className="error" role="alert">{searchParams.error}</p>}
      <table className="plain panel">
        <thead><tr><th>שם</th><th>מחיר בסיס</th><th>מינימום</th><th>מצב</th><th></th></tr></thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>{p.name}<div className="muted" dir="ltr" style={{ textAlign: "end" }}>{p.slug}</div></td>
              <td>{formatILS(p.basePrice)}</td>
              <td>{p.minQty}</td>
              <td><span className="status" data-s={p.active ? "PAID" : "CANCELLED"}>{p.active ? "פעיל" : "מושבת"}</span></td>
              <td><Link className="btn secondary small" href={`/admin/products/${p.id}`}>עריכה</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2 style={{ marginTop: 32 }}>מוצר חדש</h2>
      <form action={createProduct} className="panel admin-form">
        <ProductFields />
        <p><button className="btn">הוספה</button></p>
      </form>
    </>
  );
}
