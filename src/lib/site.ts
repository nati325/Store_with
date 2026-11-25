/** הגדרות זהות ויצירת קשר של האתר. שם ולוגו זמניים: השם ב-SITE_NAME, והלוגו ב-src/components/Logo.tsx וב-src/app/icon.svg. */
export const site = {
  name: process.env.SITE_NAME || "שי בכמות",
  whatsapp: (process.env.WHATSAPP_NUMBER || "").replace(/\D/g, ""), // בפורמט בינלאומי, למשל 972501234567
  phone: process.env.CONTACT_PHONE || "",
  email: process.env.CONTACT_EMAIL || "",
  plausibleDomain: process.env.PLAUSIBLE_DOMAIN || "",
};

export function whatsappLink(text = "") {
  return site.whatsapp ? `https://wa.me/${site.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ""}` : "";
}
