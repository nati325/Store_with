import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/admin";
import { formatILS } from "@/lib/pricing";

export const dynamic = "force-dynamic";

async function toggle(formData: FormData) {
  "use server";
  if (!isAdmin()) redirect("/admin/login");
  const id = Number(formData.get("id"));
  const p = await db.product.findUnique({ where: { id } });
  if (p) await db.product.update({ where: { id }, data: { active: !p.active } });
  revalidatePath("/admin/products");
}

/** שורת מדרגות בפורמט "50:2000, 100:1700" (כמות:מחיר בשקלים) */
function parseTiers(s: string): { minQty: number; unitPrice: number }[] {
  const out: { minQty: number; unitPrice: number }[] = [];
  for (const part of s.split(",")) {
    const [q, p] = part.split(":").map((x) => x.trim());
    const minQty = parseInt(q, 10);
    const price = parseFloat(p);
    if (minQty > 0 && price > 0) out.push({ minQty, unitPrice: Math.round(price * 100) });
  }
  return out;
}

async function create(formData: FormData) {
  "use server";
  if (!isAdmin()) redirect("/admin/login");
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const basePrice = Math.round(parseFloat(String(formData.get("basePrice"))) * 100);
  if (!name || !slug || !(basePrice > 0)) return;
  await db.product.create({
    data: {
      name, slug, basePrice,
      category: String(formData.get("category") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      minQty: Math.max(1, parseInt(String(formData.get("minQty")), 10) || 1),
      tiers: { create: parseTiers(String(formData.get("tiers") ?? "")) },
    },
  });
  revalidatePath("/admin/products");
}

export default async function AdminProducts() {
  if (!isAdmin()) redirect("/admin/login");
  const products = await db.product.findMany({ orderBy: { id: "asc" } });
  return (
    <>
      <h1>מוצרים</h1>
      <table>
        <thead><tr><th>שם</th><th>מחיר בסיס</th><th>מינימום</th><th>פעיל</th></tr></thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>{p.name}<div className="muted">{p.slug}</div></td>
              <td>{formatILS(p.basePrice)}</td>
              <td>{p.minQty}</td>
              <td>
                <form action={toggle}><input type="hidden" name="id" value={p.id} />
                  <button className="btn secondary">{p.active ? "פעיל (השבתה)" : "מושבת (הפעלה)"}</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2>מוצר חדש</h2>
      <form action={create} style={{ maxWidth: 560 }}>
        <label>שם *</label><input name="name" required />
        <label>מזהה באנגלית (slug) *</label><input name="slug" required pattern="[a-zA-Z0-9-]+" />
        <label>קטגוריה</label><input name="category" />
        <label>תיאור</label><textarea name="description" rows={2} />
        <div className="row">
          <div><label>מחיר בסיס ליחידה (₪, ללא מע״מ) *</label><input name="basePrice" type="number" step="0.01" min="0.01" required /></div>
          <div><label>כמות מינימום</label><input name="minQty" type="number" min="1" defaultValue={1} /></div>
        </div>
        <label>מדרגות מחיר (כמות:מחיר, מופרדות בפסיק)</label><input name="tiers" placeholder="50:20, 100:17" />
        <p><button className="btn">הוספה</button></p>
      </form>
    </>
  );
}
