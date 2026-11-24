import { createHash } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "admin_session";

export function adminToken(): string {
  const pw = process.env.ADMIN_PASSWORD ?? "";
  return createHash("sha256").update("bulk-shop:" + pw).digest("hex");
}

export function isAdmin(): boolean {
  if (!process.env.ADMIN_PASSWORD) return false;
  return cookies().get(ADMIN_COOKIE)?.value === adminToken();
}
