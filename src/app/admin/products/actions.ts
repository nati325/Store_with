"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { parseTiers } from "@/lib/tiers";
import { saveImage } from "@/lib/uploads";

function fields(fd: FormData) {
  const name = String(fd.get("name") ?? "").trim();
  const slug = String(fd.get("slug") ?? "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const basePrice = Math.round(parseFloat(String(fd.get("basePrice"))) * 100);
  if (!name || !slug || !(basePrice > 0)) return null;
  return {
    name, slug, basePrice,
    category: String(fd.get("category") ?? "").trim(),
    description: String(fd.get("description") ?? "").trim(),
    minQty: Math.max(1, parseInt(String(fd.get("minQty")), 10) || 1),
    tiers: parseTiers(String(fd.get("tiers") ?? "")),
  };
}

async function imageFrom(fd: FormData): Promise<string | undefined> {
  const f = fd.get("image");
  if (f instanceof File && f.size > 0) return saveImage(f);
  return undefined;
}

export async function createProduct(fd: FormData) {
  requireAdmin();
  const d = fields(fd);
  if (!d) redirect("/admin/products?error=" + encodeURIComponent("נא למלא שם, מזהה ומחיר תקינים"));
  let imageUrl = "";
  try { imageUrl = (await imageFrom(fd)) ?? ""; } catch (e) { redirect("/admin/products?error=" + encodeURIComponent((e as Error).message)); }
  const exists = await db.product.findUnique({ where: { slug: d.slug } });
  if (exists) redirect("/admin/products?error=" + encodeURIComponent("המזהה כבר קיים"));
  const { tiers, ...rest } = d;
  await db.product.create({ data: { ...rest, imageUrl, tiers: { create: tiers } } });
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function updateProduct(fd: FormData) {
  requireAdmin();
  const id = Number(fd.get("id"));
  const back = `/admin/products/${id}`;
  const d = fields(fd);
  if (!d) redirect(back + "?error=" + encodeURIComponent("נא למלא שם, מזהה ומחיר תקינים"));
  const clash = await db.product.findFirst({ where: { slug: d.slug, NOT: { id } } });
  if (clash) redirect(back + "?error=" + encodeURIComponent("המזהה כבר קיים במוצר אחר"));
  let imageUrl: string | undefined;
  try { imageUrl = await imageFrom(fd); } catch (e) { redirect(back + "?error=" + encodeURIComponent((e as Error).message)); }
  if (imageUrl === undefined && fd.get("removeImage")) imageUrl = "";
  const { tiers, ...rest } = d;
  await db.$transaction([
    db.priceTier.deleteMany({ where: { productId: id } }),
    db.product.update({ where: { id }, data: { ...rest, active: fd.get("active") === "on", ...(imageUrl !== undefined ? { imageUrl } : {}), tiers: { create: tiers } } }),
  ]);
  revalidatePath("/admin/products");
  redirect(back + "?saved=1");
}

export async function deleteProduct(fd: FormData) {
  requireAdmin();
  const id = Number(fd.get("id"));
  const used = await db.orderItem.count({ where: { productId: id } });
  if (used > 0) redirect(`/admin/products/${id}?error=` + encodeURIComponent("אי אפשר למחוק מוצר שיש לו הזמנות. השביתו אותו במקום"));
  await db.product.delete({ where: { id } });
  revalidatePath("/admin/products");
  redirect("/admin/products");
}
