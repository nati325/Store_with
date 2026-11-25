import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

const products = [
  { slug: "branded-mug", name: "ספל קרמיקה עם הדפסת לוגו", category: "מתנות לעובדים", basePrice: 2400, minQty: 20, tiers: [[50, 2000], [100, 1700], [300, 1450]], branding: "הדפסה ממוסגרת, חריטה", leadTime: "5-10 ימי עסקים", tags: "rosh-hashana,hanukkah" },
  { slug: "tote-bag", name: "תיק קנבס ממותג", category: "מוצרי מותג", basePrice: 1800, minQty: 25, tiers: [[100, 1500], [250, 1250]], branding: "הדפסה, רקמה", leadTime: "7-12 ימי עסקים", tags: "shavuot" },
  { slug: "gift-box-premium", name: "קופסת מתנה פרימיום לחג", category: "מתנות לחגים", basePrice: 8900, minQty: 10, tiers: [[50, 7900], [150, 6900]], branding: "הדפסה על האריזה, כרטיס ברכה", leadTime: "7-14 ימי עסקים", tags: "rosh-hashana,pesach,hanukkah" },
  { slug: "event-lanyard", name: "תג צוואר לכנס/אירוע", category: "ציוד לאירועים", basePrice: 650, minQty: 50, tiers: [[200, 520], [500, 410]], branding: "הדפסה בצבעים", leadTime: "5-8 ימי עסקים", tags: "" },
];

async function main() {
  for (const p of products) {
    await db.product.upsert({
      where: { slug: p.slug },
      update: { branding: p.branding, leadTime: p.leadTime, tags: p.tags },
      create: {
        slug: p.slug, name: p.name, category: p.category, basePrice: p.basePrice, minQty: p.minQty, branding: p.branding, leadTime: p.leadTime, tags: p.tags,
        description: "מוצר לדוגמה. ניתן להזמין בכמויות עם מחיר יורד לפי כמות.",
        tiers: { create: p.tiers.map(([minQty, unitPrice]) => ({ minQty, unitPrice })) },
      },
    });
  }
  console.log("seeded", products.length, "products");
}
main().finally(() => db.$disconnect());
