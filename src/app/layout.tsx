import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { Heebo, Frank_Ruhl_Libre } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";
import CartLink from "@/components/CartLink";
import { site, whatsappLink } from "@/lib/site";

const sans = Heebo({ subsets: ["hebrew", "latin"], variable: "--font-sans", display: "swap" });
const serif = Frank_Ruhl_Libre({ subsets: ["hebrew", "latin"], variable: "--font-serif", weight: ["500", "700", "900"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
  title: { default: `${site.name} | מתנות ומוצרי מותג לחברות`, template: `%s | ${site.name}` },
  description: "הזמנות בכמויות לחברות ולאירועים, עם מחירים יורדים לפי כמות",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const wa = whatsappLink("שלום, אשמח לשמוע עוד על הזמנה בכמויות");
  return (
    <html lang="he" dir="rtl" className={`${sans.variable} ${serif.variable}`}>
      <body>
        <CartProvider>
          <a href="#main" className="skip">דילוג לתוכן</a>
          <header className="top">
            <div className="wrap bar">
              <Link href="/" className="logo" aria-label="דף הבית">
                <span className="logo-mark" aria-hidden>◆</span>
                <span>{site.name}</span>
              </Link>
              <nav aria-label="ראשי">
                <Link href="/#catalog">קטלוג</Link>
                <Link href="/#how">איך זה עובד</Link>
                <Link href="/#faq">שאלות נפוצות</Link>
                <Link href="/quote">הצעת מחיר</Link>
                <CartLink />
              </nav>
            </div>
          </header>
          <main id="main">{children}</main>
          <footer className="foot">
            <div className="wrap foot-in">
              <div>
                <div className="logo"><span className="logo-mark" aria-hidden>◆</span><span>{site.name}</span></div>
                <p className="muted">מתנות, מוצרי מותג וציוד לאירועים, בכמויות ובמחירי כמות.</p>
                {(site.phone || site.email || wa) && (
                  <p className="contact">
                    {site.phone && <a href={`tel:${site.phone}`}>{site.phone}</a>}
                    {site.email && <a href={`mailto:${site.email}`}>{site.email}</a>}
                    {wa && <a href={wa} rel="noopener noreferrer" target="_blank">וואטסאפ</a>}
                  </p>
                )}
              </div>
              <nav aria-label="תחתית">
                <Link href="/#catalog">קטלוג</Link>
                <Link href="/cart">עגלה</Link>
                <Link href="/quote">הצעת מחיר</Link>
                <Link href="/terms">תקנון</Link>
                <Link href="/privacy">פרטיות</Link>
                <Link href="/accessibility">נגישות</Link>
              </nav>
            </div>
          </footer>
          {wa && (
            <a className="wa-fab no-print" href={wa} target="_blank" rel="noopener noreferrer" aria-label="שיחה בוואטסאפ">
              <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.200zm4.500-6.100c-.2-.1-1.500-.7-1.700-.8s-.4-.1-.6.100-.7.8-.8 1-.3.2-.5.1a6.700 6.700 0 0 1-3.300-2.900c-.3-.4.300-.4.800-1.400.1-.2 0-.3 0-.5l-.8-1.800c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.200 5.200 5.200 0 0 0 1.100 2.800 11.900 11.900 0 0 0 4.600 4c1.700.7 2.400.8 3.200.7a2.700 2.700 0 0 0 1.800-1.300 2.200 2.200 0 0 0 .2-1.300c-.1-.1-.2-.2-.5-.3z"/></svg>
            </a>
          )}
          {site.plausibleDomain && <Script defer data-domain={site.plausibleDomain} src="https://plausible.io/js/script.js" strategy="afterInteractive" />}
        </CartProvider>
      </body>
    </html>
  );
}
