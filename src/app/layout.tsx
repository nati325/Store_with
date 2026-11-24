import type { Metadata } from "next";
import Link from "next/link";
import { Heebo, Frank_Ruhl_Libre } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";
import CartLink from "@/components/CartLink";

const sans = Heebo({ subsets: ["hebrew", "latin"], variable: "--font-sans", display: "swap" });
const serif = Frank_Ruhl_Libre({ subsets: ["hebrew", "latin"], variable: "--font-serif", weight: ["500", "700", "900"], display: "swap" });

export const metadata: Metadata = {
  title: "מתנות ומוצרי מותג לחברות",
  description: "הזמנות בכמויות לחברות ולאירועים, עם מחירים יורדים לפי כמות",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={`${sans.variable} ${serif.variable}`}>
      <body>
        <CartProvider>
          <header className="top">
            <div className="wrap bar">
              <Link href="/" className="logo" aria-label="דף הבית">
                <span className="logo-mark" aria-hidden>◆</span>
                <span>חנות לעסקים</span>
              </Link>
              <nav aria-label="ראשי">
                <Link href="/#catalog">קטלוג</Link>
                <Link href="/#how">איך זה עובד</Link>
                <CartLink />
              </nav>
            </div>
          </header>
          <main>{children}</main>
          <footer className="foot">
            <div className="wrap foot-in">
              <div>
                <div className="logo"><span className="logo-mark" aria-hidden>◆</span><span>חנות לעסקים</span></div>
                <p className="muted">מתנות, מוצרי מותג וציוד לאירועים, בכמויות ובמחירי כמות.</p>
              </div>
              <nav aria-label="תחתית">
                <Link href="/#catalog">קטלוג</Link>
                <Link href="/cart">עגלה</Link>
              </nav>
            </div>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
