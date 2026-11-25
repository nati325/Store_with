/** הגדרות זהות ויצירת קשר של האתר. שם ולוגו זמניים: משנים כאן או ב-.env בלבד. */
export const site = {
  name: process.env.SITE_NAME || "חנות לעסקים",
  whatsapp: (process.env.WHATSAPP_NUMBER || "").replace(/\D/g, ""), // בפורמט בינלאומי, למשל 972501234567
  phone: process.env.CONTACT_PHONE || "",
  email: process.env.CONTACT_EMAIL || "",
  plausibleDomain: process.env.PLAUSIBLE_DOMAIN || "",
};

export function whatsappLink(text = "") {
  return site.whatsapp ? `https://wa.me/${site.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ""}` : "";
}
