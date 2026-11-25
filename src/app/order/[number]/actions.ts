"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { tokenOk } from "@/lib/orderMail";
import { sendMail, siteUrl } from "@/lib/mail";
import { allow } from "@/lib/ratelimit";
import { cardcomConfig, createPayment } from "@/lib/cardcom";

/** תגובת לקוח להדמיה: אישור או בקשת שינויים. מוגן בטוקן ההזמנה. */
export async function respondProof(fd: FormData) {
  const number = String(fd.get("number") ?? "");
  const token = String(fd.get("token") ?? "");
  const o = await db.order.findUnique({ where: { number } });
  if (!o || !tokenOk(token, o.token) || o.proofStatus !== "SENT") redirect("/");
  const approve = fd.get("decision") === "approve";
  const reply = String(fd.get("reply") ?? "").trim().slice(0, 1000);
  if (!approve && !reply) redirect(`/order/${number}?t=${token}&err=reply`);
  await db.order.update({ where: { id: o.id }, data: { proofStatus: approve ? "APPROVED" : "CHANGES", proofReply: reply } });
  await sendMail({
    to: process.env.ADMIN_EMAIL || "",
    subject: `${approve ? "הדמיה אושרה" : "התבקשו שינויים בהדמיה"}: ${o.number}`,
    text: `${o.company} / ${o.customerName}\n${reply}\n\n${siteUrl()}/admin/orders/${o.id}`,
  });
  revalidatePath(`/order/${number}`);
  redirect(`/order/${number}?t=${token}`);
}

/** פתיחת דף תשלום מאובטח ב-Cardcom. אפשרי רק להזמנה שאושרה ועדיין לא שולמה. */
export async function startPayment(fd: FormData) {
  const number = String(fd.get("number") ?? "");
  const token = String(fd.get("token") ?? "");
  const o = await db.order.findUnique({ where: { number }, include: { items: true } });
  if (!o || !tokenOk(token, o.token)) redirect("/");
  const back = `/order/${number}?t=${token}`;
  if (!cardcomConfig() || o.status !== "CONFIRMED" || o.paidAt) redirect(back);
  if (!allow("pay:" + number, 10, 60 * 60 * 1000)) redirect(back + "&err=pay");
  let url = "";
  try {
    const r = await createPayment(o);
    await db.order.update({ where: { id: o.id }, data: { lowProfileId: r.lowProfileId } });
    url = r.url;
  } catch (e) {
    console.error("[cardcom] create failed", e);
    redirect(back + "&err=pay");
  }
  redirect(url);
}
