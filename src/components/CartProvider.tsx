"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type CartLine = { productId: number; slug: string; name: string; qty: number };
type Ctx = {
  lines: CartLine[];
  count: number;
  add: (l: CartLine) => void;
  setQty: (productId: number, qty: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
};
const CartCtx = createContext<Ctx | null>(null);
const KEY = "bulk-shop-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch {}
  }, [lines, ready]);

  const value: Ctx = {
    lines,
    count: lines.length,
    add: (l) =>
      setLines((cur) => {
        const ex = cur.find((x) => x.productId === l.productId);
        return ex ? cur.map((x) => (x.productId === l.productId ? { ...x, qty: x.qty + l.qty } : x)) : [...cur, l];
      }),
    setQty: (id, qty) => setLines((cur) => cur.map((x) => (x.productId === id ? { ...x, qty } : x))),
    remove: (id) => setLines((cur) => cur.filter((x) => x.productId !== id)),
    clear: () => setLines([]),
  };
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart outside CartProvider");
  return c;
}
