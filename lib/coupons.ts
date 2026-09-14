"use client";

import { useCallback, useEffect, useState } from "react";

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
const COUPONS_URL = "/data/coupons.json";

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

let couponCache: Coupon[] | null = null;
if (typeof window !== "undefined") {
  fetch(COUPONS_URL, { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : null))
    .then((j) => {
      const s = sanitizeCoupons(j);
      if (s) couponCache = s;
    })
    .catch(() => {
      /* keep defaults */
    });
}

/** All coupons: shared JSON when loaded, else defaults. Safe on server. */
export function getCoupons(): Coupon[] {
  if (typeof window === "undefined") return DEFAULT_COUPONS;
  if (couponCache) return couponCache;
  try {
    const raw = window.localStorage.getItem(COUPONS_STORAGE_KEY);
    if (raw) {
      const parsed = sanitizeCoupons(JSON.parse(raw));
      if (parsed) return parsed;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_COUPONS;
}

export async function saveCouponsRemote(coupons: Coupon[], pin: string) {
  // POST (not PUT): some mobile networks/proxies reject PUT with 405.
  const res = await fetch("/api/coupons", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-pin": pin },
    body: JSON.stringify(
      coupons.map((c) => ({ ...c, code: normalizeCode(c.code) })),
    ),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error ?? `Save failed (${res.status})`);
  const next = sanitizeCoupons(json?.coupons ?? coupons) ?? coupons;
  couponCache = next;
  try {
    window.localStorage.removeItem(COUPONS_STORAGE_KEY);
  } catch {
    /* ignore */
  }
  return json as { ok: true; committed?: boolean; sha?: string; url?: string };
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

/** Reactive coupon list for admin + checkout (reads shared JSON). */
export function useCoupons() {
  const [coupons, setCouponsState] = useState<Coupon[]>(DEFAULT_COUPONS);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(COUPONS_URL, { cache: "no-store" });
        if (!res.ok) return;
        const s = sanitizeCoupons(await res.json());
        if (s && !cancelled) {
          couponCache = s;
          setCouponsState(s);
          return;
        }
      } catch {
        /* ignore */
      }
      if (!cancelled) {
        const local = getCoupons();
        couponCache = local;
        setCouponsState(local);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setCoupons = useCallback(async (next: Coupon[], pin: string) => {
    const result = await saveCouponsRemote(next, pin);
    const clean = sanitizeCoupons(next) ?? next;
    couponCache = clean;
    setCouponsState(clean);
    return result;
  }, []);

  const reset = useCallback(
    async (pin: string) => {
      const result = await saveCouponsRemote(DEFAULT_COUPONS, pin);
      couponCache = DEFAULT_COUPONS;
      setCouponsState(DEFAULT_COUPONS);
      return result;
    },
    [],
  );

  return { coupons, setCoupons, reset, setCouponsState };
}

export { sanitizeCoupons };
