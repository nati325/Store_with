"use client";
import Link from "next/link";
import { useCart } from "./CartProvider";

export default function CartLink() {
  const { count } = useCart();
  return (
    <Link href="/cart" className="cart-pill">
      עגלה{count > 0 && <span className="cart-count">{count}</span>}
    </Link>
  );
}
