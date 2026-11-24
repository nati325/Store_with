import Link from "next/link";

export const metadata = { title: "ניהול" };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <nav style={{ marginBottom: 16 }}>
        <Link href="/admin/orders">הזמנות</Link>
        <Link href="/admin/products">מוצרים</Link>
      </nav>
      {children}
    </>
  );
}
