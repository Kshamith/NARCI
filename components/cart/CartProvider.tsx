"use client";

import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { products as defaultProducts } from "@/data/products";
import type { Product } from "@/data/products";
import { getSizePrice } from "@/data/products";
import { getCatalogProducts, sanitizeProducts } from "@/lib/catalog-store";
import { applyCoupon, normalizeCode } from "@/lib/coupons";

export type CartLine = { sku: string; qty: number; size?: string };

const STORAGE_KEY = "narci-cart";
const COUPON_KEY = "narci-coupon";

export function lineKey(line: Pick<CartLine, "sku" | "size">) {
  return `${line.sku}__${(line.size ?? "").toLowerCase()}`;
}

type ResolvedLine = {
  line: CartLine;
  product: Product;
  unitPrice: number;
  sizeLabel?: string;
};

type CartContextValue = {
  lines: CartLine[];
  hydrated: boolean;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  add: (sku: string, qty?: number, size?: string) => void;
  setQty: (sku: string, qty: number, size?: string) => void;
  remove: (sku: string, size?: string) => void;
  clearCoupon: () => void;
  couponCode: string;
  setCouponCode: (code: string) => void;
  couponError?: string;
  count: number;
  subtotal: number;
  discount: number;
  total: number;
  resolved: ResolvedLine[];
};

export const CartContext = createContext<CartContextValue | null>(null);

function readStored(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartLine[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (l) =>
          typeof l.sku === "string" && typeof l.qty === "number" && l.qty > 0,
      )
      .map((l) => ({
        sku: l.sku,
        qty: l.qty,
        size: typeof l.size === "string" && l.size ? l.size : undefined,
      }));
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [catalog, setCatalog] = useState<Product[]>(defaultProducts);
  const [hydrated, setHydrated] = useState(false);
  const [isOpen, setOpen] = useState(false);
  const [couponCode, setCouponCodeState] = useState("");

  useEffect(() => {
    setLines(readStored());
    try {
      const saved = localStorage.getItem(COUPON_KEY);
      if (saved) setCouponCodeState(normalizeCode(saved));
    } catch {
      /* ignore */
    }
    fetch("/data/products.json", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const next = getCatalogProducts();
        const clean = sanitizeProducts(j);
        if (clean) setCatalog(clean);
        else setCatalog(next);
      })
      .catch(() => setCatalog(getCatalogProducts()));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  const setCouponCode = useCallback(
    (code: string) => {
      const n = normalizeCode(code);
      setCouponCodeState(n);
      try {
        if (n) localStorage.setItem(COUPON_KEY, n);
        else localStorage.removeItem(COUPON_KEY);
      } catch {
        /* ignore */
      }
    },
    [],
  );

  const clearCoupon = useCallback(() => setCouponCode(""), [setCouponCode]);

  const add = useCallback((sku: string, qty = 1, size?: string) => {
    setLines((prev) => {
      const key = lineKey({ sku, size });
      const existing = prev.find((l) => lineKey(l) === key);
      if (existing) {
        return prev.map((l) =>
          lineKey(l) === key ? { ...l, qty: l.qty + qty } : l,
        );
      }
      return [...prev, { sku, qty, size }];
    });
    setOpen(true);
  }, []);

  const setQty = useCallback((sku: string, qty: number, size?: string) => {
    const key = lineKey({ sku, size });
    setLines((prev) => {
      if (qty <= 0) return prev.filter((l) => lineKey(l) !== key);
      return prev.map((l) => (lineKey(l) === key ? { ...l, qty } : l));
    });
  }, []);

  const remove = useCallback((sku: string, size?: string) => {
    const key = lineKey({ sku, size });
    setLines((prev) => prev.filter((l) => lineKey(l) !== key));
  }, []);

  const resolved = useMemo<ResolvedLine[]>(() => {
    const bySku = new Map(catalog.map((p) => [p.sku, p]));
    return lines.flatMap((line) => {
      const product =
        bySku.get(line.sku) ?? defaultProducts.find((p) => p.sku === line.sku);
      if (!product) return [];
      return [
        {
          line,
          product,
          unitPrice: getSizePrice(product, line.size),
          sizeLabel: line.size,
        },
      ];
    });
  }, [lines, catalog]);

  const count = useMemo(
    () => lines.reduce((sum, l) => sum + l.qty, 0),
    [lines],
  );

  const subtotal = useMemo(
    () => resolved.reduce((sum, r) => sum + r.unitPrice * r.line.qty, 0),
    [resolved],
  );

  const { discount, total, couponError } = useMemo(() => {
    if (!couponCode) return { discount: 0, total: subtotal, couponError: undefined as string | undefined };
    const r = applyCoupon(subtotal, couponCode);
    return { discount: r.discount, total: r.total, couponError: r.error };
  }, [subtotal, couponCode]);

  const value = useMemo(
    () => ({
      lines,
      hydrated,
      isOpen,
      setOpen,
      add,
      setQty,
      remove,
      clearCoupon,
      couponCode,
      setCouponCode,
      couponError,
      count,
      subtotal,
      discount,
      total,
      resolved,
    }),
    [lines, hydrated, isOpen, add, setQty, remove, clearCoupon, couponCode, setCouponCode, couponError, count, subtotal, discount, total, resolved],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
