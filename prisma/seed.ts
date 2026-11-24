import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

const products = [
  { slug: "branded-mug", name: "ספל קרמיקה עם הדפסת לוגו", category: "מתנות לעובדים", basePrice: 2400, minQty: 20, tiers: [[50, 2000], [100, 1700], [300, 1450]] },
  { slug: "tote-bag", name: "תיק קנבס ממותג", category: "מוצרי מותג", basePrice: 1800, minQty: 25, tiers: [[100, 1500], [250, 1250]] },
  { slug: "gift-box-premium", name: "קופסת מתנה פרימיום לחג", category: "מתנות לחגים", basePrice: 8900, minQty: 10, tiers: [[50, 7900], [150, 6900]] },
  { slug: "event-lanyard", name: "תג צוואר לכנס/אירוע", category: "ציוד לאירועים", basePrice: 650, minQty: 50, tiers: [[200, 520], [500, 410]] },
];

async function main() {
  for (const p of products) {
    await db.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        slug: p.slug, name: p.name, category: p.category, basePrice: p.basePrice, minQty: p.minQty,
        description: "מוצר לדוגמה. ניתן להזמין בכמויות עם מחיר יורד לפי כמות.",
        tiers: { create: p.tiers.map(([minQty, unitPrice]) => ({ minQty, unitPrice })) },
      },
    });
  }
  console.log("seeded", products.length, "products");
}
main().finally(() => db.$disconnect());
