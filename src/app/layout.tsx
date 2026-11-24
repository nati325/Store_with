import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";
import CartLink from "@/components/CartLink";

export const metadata: Metadata = {
  title: "מתנות ומוצרי מותג לחברות",
  description: "הזמנות בכמויות לחברות ולאירועים, עם מחירים יורדים לפי כמות",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body>
        <CartProvider>
          <header className="top">
            <div className="wrap">
              <Link href="/" className="logo">חנות לעסקים</Link>
              <nav>
                <Link href="/">קטלוג</Link>
                <CartLink />
              </nav>
            </div>
          </header>
          <main className="wrap">{children}</main>
        </CartProvider>
      </body>
    </html>
  );
}
