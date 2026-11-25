"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { tokenOk } from "@/lib/orderMail";
import { sendMail, siteUrl } from "@/lib/mail";

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
