import { useEffect, useState } from "react";

export type CouponKind = "percent" | "flat";

export type Coupon = {
  code: string;
  kind: CouponKind;
  /** percent: 1-90 (% off). flat: INR amount off. */
  value: number;
  /** Minimum subtotal (INR) required, 0 = none. */
  minSubtotal?: number;
  active: boolean;
};

export const COUPONS_STORAGE_KEY = "narci-coupons-v1";

export const DEFAULT_COUPONS: Coupon[] = [
  { code: "NARCI10", kind: "percent", value: 10, minSubtotal: 0, active: true },
  { code: "FLAT500", kind: "flat", value: 500, minSubtotal: 2000, active: true },
];

export function normalizeCode(code: string) {
  return code.trim().toUpperCase();
}

function sanitizeCoupons(list: unknown): Coupon[] | null {
  if (!Array.isArray(list)) return null;
  const out: Coupon[] = [];
  for (const c of list) {
    if (typeof c !== "object" || c === null) continue;
    const rec = c as Record<string, unknown>;
    if (typeof rec.code !== "string" || !rec.code.trim()) continue;
    if (rec.kind !== "percent" && rec.kind !== "flat") continue;
    const value = Number(rec.value);
    if (!Number.isFinite(value) || value <= 0) continue;
    const minSubtotal =
      rec.minSubtotal === undefined ? 0 : Number(rec.minSubtotal);
    out.push({
      code: normalizeCode(rec.code),
      kind: rec.kind,
      value,
      minSubtotal:
        Number.isFinite(minSubtotal) && minSubtotal > 0 ? minSubtotal : 0,
      active: rec.active !== false,
    });
  }
  return out;
}

/** All coupons: admin overrides from localStorage when present, else defaults. Safe on server. */
export function getCoupons(): Coupon[] {
  if (typeof window === "undefined") return DEFAULT_COUPONS;
  try {
    const raw = window.localStorage.getItem(COUPONS_STORAGE_KEY);
    if (!raw) return DEFAULT_COUPONS;
    const parsed = sanitizeCoupons(JSON.parse(raw));
    return parsed ?? DEFAULT_COUPONS;
  } catch {
    return DEFAULT_COUPONS;
  }
}

export function saveCoupons(coupons: Coupon[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    COUPONS_STORAGE_KEY,
    JSON.stringify(
      coupons.map((c) => ({ ...c, code: normalizeCode(c.code) })),
    ),
  );
}

export function resetCoupons() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(COUPONS_STORAGE_KEY);
}

export function getCouponByCode(code: string): Coupon | undefined {
  const n = normalizeCode(code);
  if (!n) return undefined;
  return getCoupons().find((c) => c.code === n && c.active);
}

export type CouponResult = {
  coupon?: Coupon;
  discount: number;
  total: number;
  error?: string;
};

export function applyCoupon(subtotal: number, code: string): CouponResult {
  const n = normalizeCode(code);
  if (!n) return { discount: 0, total: subtotal };
  const coupon = getCoupons().find((c) => c.code === n);
  if (!coupon || !coupon.active) {
    return { discount: 0, total: subtotal, error: "Invalid coupon code." };
  }
  if ((coupon.minSubtotal ?? 0) > subtotal) {
    return {
      coupon,
      discount: 0,
      total: subtotal,
      error: `Needs a minimum subtotal of ₹${coupon.minSubtotal}.`,
    };
  }
  const discount =
    coupon.kind === "percent"
      ? Math.floor((subtotal * Math.min(coupon.value, 90)) / 100)
      : Math.min(coupon.value, subtotal);
  return { coupon, discount, total: Math.max(0, subtotal - discount) };
}

/** Reactive coupon list for admin + checkout. */
export function useCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>(DEFAULT_COUPONS);
  useEffect(() => {
    setCoupons(getCoupons());
  }, []);
  return {
    coupons,
    setCoupons: (next: Coupon[]) => {
      saveCoupons(next);
      setCoupons(next);
    },
    reset: () => {
      resetCoupons();
      setCoupons(DEFAULT_COUPONS);
    },
  };
}
