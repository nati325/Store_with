import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, adminToken } from "@/lib/admin";
import { allow } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

async function login(formData: FormData) {
  "use server";
  const pw = process.env.ADMIN_PASSWORD;
  const ip = headers().get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (!allow("login:" + ip, 8, 15 * 60 * 1000)) redirect("/admin/login?error=rate");
  if (pw && formData.get("password") === pw) {
    cookies().set(ADMIN_COOKIE, adminToken(), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/admin", maxAge: 60 * 60 * 12 });
    redirect("/admin/orders");
  }
  redirect("/admin/login?error=1");
}

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <form action={login} className="panel" style={{ maxWidth: 380, margin: "64px auto" }}>
      <h1 style={{ fontSize: "2rem" }}>כניסת מנהל</h1>
      <label>סיסמה</label>
      <input type="password" name="password" required autoFocus />
      {searchParams.error && <p className="error" role="alert">{searchParams.error === "rate" ? "יותר מדי ניסיונות. נסו שוב בעוד כמה דקות" : "סיסמה שגויה"}</p>}
      <p><button className="btn block">כניסה</button></p>
    </form>
  );
}
