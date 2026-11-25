import { randomBytes, timingSafeEqual } from "crypto";
import { sendMail, siteUrl } from "./mail";
import { CUSTOMER_STATUS } from "./statuses";

export const newToken = () => randomBytes(16).toString("hex");

export const UPLOAD_URL_RE = /^\/api\/uploads\/[a-f0-9]{24}\.(jpg|png|webp|gif)$/;
export const safeUploadUrl = (s: unknown) => (typeof s === "string" && UPLOAD_URL_RE.test(s) ? s : "");

export function tokenOk(given: unknown, actual: string): boolean {
  if (typeof given !== "string" || !actual || given.length !== actual.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(actual));
}

export const orderLink = (o: { number: string; token: string }) => `${siteUrl()}/order/${o.number}?t=${o.token}`;

type O = { number: string; token: string; email: string; customerName: string; status: string; paymentUrl: string; proofStatus: string };

export async function sendOrderUpdate(o: O, extra = "") {
  const lines = [`שלום ${o.customerName},`, "", `ההזמנה ${o.number} עודכנה. סטטוס: ${CUSTOMER_STATUS[o.status] ?? o.status}.`];
  if (o.proofStatus === "SENT") lines.push("", "שלחנו אליכם הדמיה לאישור. אפשר לאשר או לבקש שינויים בדף ההזמנה.");
  if (o.paymentUrl && o.status !== "PAID" && o.status !== "CANCELLED") lines.push("", `לתשלום: ${o.paymentUrl}`);
  if (extra) lines.push("", extra);
  lines.push("", `מעקב ופרטים: ${orderLink(o)}`);
  return sendMail({ to: o.email, subject: `עדכון להזמנה ${o.number}`, text: lines.join("\n") });
}
