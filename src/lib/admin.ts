import { createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const ADMIN_COOKIE = "admin_session";

export function adminToken(): string {
  const pw = process.env.ADMIN_PASSWORD ?? "";
  return createHash("sha256").update("bulk-shop:" + pw).digest("hex");
}

export function isAdmin(): boolean {
  if (!process.env.ADMIN_PASSWORD) return false;
  const v = cookies().get(ADMIN_COOKIE)?.value;
  if (!v) return false;
  const a = Buffer.from(v), b = Buffer.from(adminToken());
  return a.length === b.length && timingSafeEqual(a, b);
}

export function requireAdmin() {
  if (!isAdmin()) redirect("/admin/login");
}
