"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "./CartProvider";
import { formatILS, unitPriceFor, Tier } from "@/lib/pricing";

export default function AddToCart(props: { productId: number; slug: string; name: string; basePrice: number; minQty: number; tiers: Tier[] }) {
  const [qty, setQty] = useState(props.minQty);
  const { add } = useCart();
  const router = useRouter();
  const valid = Number.isInteger(qty) && qty >= props.minQty;
  const unit = unitPriceFor(props.basePrice, props.tiers, qty);

  return (
    <div className="card">
      <label htmlFor="qty">כמות (מינימום {props.minQty})</label>
      <input id="qty" type="number" min={props.minQty} value={qty} onChange={(e) => setQty(parseInt(e.target.value, 10) || 0)} />
      {valid ? (
        <p>
          מחיר ליחידה: <b>{formatILS(unit)}</b><br />
          סה״כ לפני מע״מ: <b>{formatILS(unit * qty)}</b>
        </p>
      ) : (
        <p className="error">הכמות המינימלית היא {props.minQty}</p>
      )}
      <button
        className="btn"
        disabled={!valid}
        onClick={() => {
          add({ productId: props.productId, slug: props.slug, name: props.name, qty });
          router.push("/cart");
        }}
      >
        הוספה לעגלה
      </button>
    </div>
  );
}
