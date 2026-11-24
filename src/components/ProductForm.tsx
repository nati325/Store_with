import { tiersToText } from "@/lib/tiers";

type P = { id?: number; name?: string; slug?: string; category?: string; description?: string; basePrice?: number; minQty?: number; imageUrl?: string; active?: boolean; tiers?: { minQty: number; unitPrice: number }[] };

/** שדות משותפים ליצירה ולעריכה של מוצר (שרת בלבד, בלי state). */
export default function ProductFields({ p = {} }: { p?: P }) {
  return (
    <>
      <label htmlFor="name">שם *</label><input id="name" name="name" defaultValue={p.name} required />
      <label htmlFor="slug">מזהה באנגלית (slug) *</label><input id="slug" name="slug" defaultValue={p.slug} required pattern="[a-zA-Z0-9\-]+" dir="ltr" />
      <label htmlFor="category">קטגוריה</label><input id="category" name="category" defaultValue={p.category} />
      <label htmlFor="description">תיאור</label><textarea id="description" name="description" rows={3} defaultValue={p.description} />
      <div className="row">
        <div><label htmlFor="basePrice">מחיר בסיס ליחידה (₪, ללא מע״מ) *</label><input id="basePrice" name="basePrice" type="number" step="0.01" min="0.01" defaultValue={p.basePrice != null ? p.basePrice / 100 : undefined} required /></div>
        <div><label htmlFor="minQty">כמות מינימום</label><input id="minQty" name="minQty" type="number" min="1" defaultValue={p.minQty ?? 1} /></div>
      </div>
      <label htmlFor="tiers">מדרגות מחיר (כמות:מחיר, מופרדות בפסיק)</label>
      <input id="tiers" name="tiers" placeholder="50:20, 100:17" defaultValue={p.tiers ? tiersToText(p.tiers) : ""} dir="ltr" />
      <label htmlFor="image">תמונה (JPG, PNG, WEBP או GIF, עד 5MB)</label>
      <input id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" />
      {p.imageUrl && (
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.imageUrl} alt="" width={64} height={48} style={{ objectFit: "cover", borderRadius: 8 }} />
          <input type="checkbox" name="removeImage" style={{ width: "auto" }} /> הסרת התמונה הנוכחית
        </label>
      )}
    </>
  );
}
