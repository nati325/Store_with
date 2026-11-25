"use client";
import { useRouter } from "next/navigation";
import { useCart } from "./CartProvider";

export default function ReorderButton({ items }: { items: { productId: number; slug: string; name: string; qty: number }[] }) {
  const { add } = useCart();
  const router = useRouter();
  return (
    <button className="btn secondary" onClick={() => { items.forEach((i) => add(i)); router.push("/cart"); }}>
      הזמנה חוזרת
    </button>
  );
}
