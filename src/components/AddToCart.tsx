"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "./CartProvider";
import { formatILS, unitPriceFor, Tier } from "@/lib/pricing";

export default function AddToCart(props: { productId: number; slug: string; name: string; basePrice: number; minQty: number; tiers: Tier[] }) {
  const [qty, setQty] = useState(props.tiers.length ? Math.max(props.minQty, props.tiers[0].minQty) : props.minQty);
  const { add } = useCart();
  const router = useRouter();
  const valid = Number.isInteger(qty) && qty >= props.minQty;
  const unit = unitPriceFor(props.basePrice, props.tiers, qty);
  const sorted = [...props.tiers].sort((a, b) => a.minQty - b.minQty);
  const rows = [{ minQty: props.minQty, unitPrice: props.basePrice }, ...sorted];
  const activeMin = valid ? rows.reduce((m, r) => (qty >= r.minQty && r.minQty >= m ? r.minQty : m), 0) : -1;
  const quick = Array.from(new Set([props.minQty, ...sorted.map((t) => t.minQty)]));
  const savePct = valid && unit < props.basePrice ? Math.round((1 - unit / props.basePrice) * 100) : 0;

  return (
    <div className="buy">
      <div className="panel">
        <h3>מחירי כמות</h3>
        <p className="muted" style={{ marginBottom: 6 }}>מחיר ליחידה, ללא מע״מ</p>
        <table className="tiers" aria-label="מחירי כמות">
          <tbody>
            {rows.map((r) => (
              <tr key={r.minQty} className={r.minQty === activeMin ? "on" : ""}>
                <td>{r.minQty}+ יחידות</td>
                <td>{formatILS(r.unitPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel">
        <label htmlFor="qty" style={{ marginTop: 0 }}>כמות (מינימום {props.minQty})</label>
        <div className="qty">
          <button type="button" aria-label="הפחת" onClick={() => setQty(Math.max(props.minQty, qty - 10))}>−</button>
          <input id="qty" type="number" inputMode="numeric" min={props.minQty} value={qty || ""} onChange={(e) => setQty(parseInt(e.target.value, 10) || 0)} />
          <button type="button" aria-label="הוסף" onClick={() => setQty(qty + 10)}>+</button>
        </div>
        <div className="quick">
          {quick.map((q) => (<button key={q} type="button" className={q === qty ? "on" : ""} onClick={() => setQty(q)}>{q}</button>))}
        </div>
        {valid ? (
          <div className="total-box" aria-live="polite">
            <span className="muted">{formatILS(unit)} ליחידה{savePct > 0 && ` · חיסכון ${savePct}%`}</span>
            <span className="big">{formatILS(unit * qty)}</span>
            <span className="muted">לפני מע״מ</span>
          </div>
        ) : (
          <p className="error" style={{ margin: "16px 0" }}>הכמות המינימלית היא {props.minQty}</p>
        )}
        <button
          className="btn block"
          disabled={!valid}
          onClick={() => {
            add({ productId: props.productId, slug: props.slug, name: props.name, qty });
            router.push("/cart");
          }}
        >
          הוספה לעגלה
        </button>
        <ul className="perks" style={{ marginTop: 16 }}>
          <li>ללא חיוב באתר, תשלום אחרי אישור</li>
          <li>אפשר לציין התאמה ללוגו בהערות</li>
        </ul>
      </div>
    </div>
  );
}
