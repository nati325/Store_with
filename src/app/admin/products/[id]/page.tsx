import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import ProductFields from "@/components/ProductForm";
import { updateProduct, deleteProduct } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditProduct({ params, searchParams }: { params: { id: string }; searchParams: { error?: string; saved?: string } }) {
  requireAdmin();
  const p = await db.product.findUnique({ where: { id: Number(params.id) }, include: { tiers: true } });
  if (!p) notFound();
  return (
    <>
      <p><Link href="/admin/products" className="muted">← כל המוצרים</Link></p>
      <h1 style={{ fontSize: "2rem" }}>עריכת מוצר</h1>
      {searchParams.error && <p className="error" role="alert">{searchParams.error}</p>}
      {searchParams.saved && <p style={{ color: "var(--ok)", fontWeight: 700 }} role="status">נשמר</p>}
      <form action={updateProduct} className="panel admin-form">
        <input type="hidden" name="id" value={p.id} />
        <ProductFields p={p} />
        <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 16 }}>
          <input type="checkbox" name="active" defaultChecked={p.active} style={{ width: "auto" }} /> מוצר פעיל (מוצג בחנות)
        </label>
        <p style={{ marginTop: 16 }}><button className="btn">שמירה</button></p>
      </form>
      <form action={deleteProduct} className="panel admin-form" style={{ marginTop: 16 }}>
        <input type="hidden" name="id" value={p.id} />
        <p className="muted">מחיקה אפשרית רק למוצר שלא הוזמן אף פעם. אחרת, השביתו אותו.</p>
        <button className="btn secondary">מחיקת המוצר</button>
      </form>
    </>
  );
}
