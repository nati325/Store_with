import Link from "next/link";

export const metadata = { title: "ניהול", robots: { index: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="wrap" style={{ paddingBottom: 64 }}>
      <nav className="admin-nav no-print" aria-label="ניהול">
        <Link href="/admin">סקירה</Link>
        <Link href="/admin/orders">הזמנות</Link>
        <Link href="/admin/quotes">הצעות מחיר</Link>
        <Link href="/admin/products">מוצרים</Link>
        <Link href="/admin/campaigns">דפי חג</Link>
        <Link href="/admin/programs">העובד בוחר</Link>
      </nav>
      {children}
    </div>
  );
}
