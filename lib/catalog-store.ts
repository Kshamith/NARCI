"use client";

import { useCallback, useEffect, useState } from "react";
import { products as defaultProducts } from "@/data/products";
import type { Product } from "@/data/products";

export const CATALOG_STORAGE_KEY = "narci-admin-products-v1";
const CATALOG_URL = "/data/products.json";

/**
 * Shared catalog.
 * Reads from /data/products.json (committed to the repo, same for every
 * device after redeploy). Falls back to bundled defaults + legacy
 * localStorage overrides from older admin versions.
 */

function sanitizeProducts(list: unknown): Product[] | null {
  if (!Array.isArray(list) || list.length === 0) return null;
  const out: Product[] = [];
  for (const p of list) {
    if (typeof p !== "object" || p === null) continue;
    const r = p as Record<string, unknown>;
    if (
      typeof r.sku !== "string" ||
      typeof r.slug !== "string" ||
      typeof r.name !== "string"
    ) {
      continue;
    }
    const sizes = Array.isArray(r.sizes)
      ? (r.sizes as unknown[])
          .filter(
            (s): s is { label: string; price: number } =>
              typeof s === "object" &&
              s !== null &&
              typeof (s as { label: unknown }).label === "string" &&
              Number.isFinite(Number((s as { price: unknown }).price)),
          )
          .map((s) => ({
            label: String(s.label),
            price: Number(s.price),
          }))
      : undefined;
    out.push({
      id: String(r.id ?? r.sku),
      sku: String(r.sku),
      slug: String(r.slug),
      name: String(r.name),
      tagline: String(r.tagline ?? ""),
      description: String(r.description ?? ""),
      price: Number.isFinite(Number(r.price)) ? Number(r.price) : 0,
      sizes:
        sizes && sizes.length > 0
          ? sizes
          : [
              {
                label: "ONE SIZE",
                price: Number.isFinite(Number(r.price))
                  ? Number(r.price)
                  : 0,
              },
            ],
      images: Array.isArray(r.images)
        ? (r.images as unknown[]).map(String).filter(Boolean)
        : [],
      category: String(r.category ?? "uncategorized"),
      specs: Array.isArray(r.specs)
        ? (r.specs as unknown[]).map(String)
        : [],
      isNew: r.isNew === true,
    });
  }
  return out.length > 0 ? out : null;
}

/** Synchronous snapshot: bundled defaults (safe on server). */
export function getCatalogProducts(): Product[] {
  if (typeof window === "undefined") return defaultProducts;
  return defaultProducts;
}

async function fetchSharedCatalog(): Promise<Product[] | null> {
  try {
    const res = await fetch(CATALOG_URL, { cache: "no-store" });
    if (!res.ok) return null;
    return sanitizeProducts(await res.json());
  } catch {
    return null;
  }
}

function readLegacyLocal(): Product[] | null {
  try {
    const raw = window.localStorage.getItem(CATALOG_STORAGE_KEY);
    if (!raw) return null;
    return sanitizeProducts(JSON.parse(raw));
  } catch {
    return null;
  }
}

/** Persist via API (commits to GitHub on Vercel). Returns commit info. */
export async function saveCatalogProductsRemote(next: Product[], pin: string) {
  const res = await fetch("/api/products", {
    method: "PUT",
    headers: { "Content-Type": "application/json", "x-admin-pin": pin },
    body: JSON.stringify(next),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error ?? `Save failed (${res.status})`);
  try {
    window.localStorage.removeItem(CATALOG_STORAGE_KEY);
  } catch {
    /* ignore */
  }
  return json as { ok: true; committed?: boolean; sha?: string; url?: string };
}

export function resetCatalogProducts() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CATALOG_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function useCatalogProducts() {
  const [items, setItems] = useState<Product[]>(defaultProducts);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const shared = await fetchSharedCatalog();
      if (cancelled) return;
      if (shared) {
        setItems(shared);
      } else {
        const legacy = readLegacyLocal();
        if (legacy) setItems(legacy);
      }
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback(
    async (next: Product[], pin: string) => {
      const result = await saveCatalogProductsRemote(next, pin);
      setItems(next);
      return result;
    },
    [],
  );

  const reset = useCallback(async (pin: string) => {
    const result = await saveCatalogProductsRemote(defaultProducts, pin);
    setItems(defaultProducts);
    return result;
  }, []);

  return { items, loaded, persist, reset, setItems };
}

export { sanitizeProducts };
