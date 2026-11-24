import Link from "next/link";

export const metadata = { title: "ניהול" };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="wrap" style={{ paddingBottom: 64 }}>
      <nav className="admin-nav" aria-label="ניהול">
        <Link href="/admin/orders">הזמנות</Link>
        <Link href="/admin/products">מוצרים</Link>
      </nav>
      {children}
    </div>
  );
}
