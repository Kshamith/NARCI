import { useEffect, useState } from "react";
import { products as defaultProducts } from "@/data/products";
import type { Product } from "@/data/products";

export const CATALOG_STORAGE_KEY = "narci-admin-products-v1";

/**
 * Admin catalog overrides.
 * Today: static defaults in data/products.ts merged with localStorage edits
 * from /admin. Later: swap getCatalogProducts() to fetch from a headless CMS
 * without touching shop/cart components.
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
    });
  }
  return out.length > 0 ? out : null;
}

/** Merged catalog. Safe on server (returns static defaults). */
export function getCatalogProducts(): Product[] {
  if (typeof window === "undefined") return defaultProducts;
  try {
    const raw = window.localStorage.getItem(CATALOG_STORAGE_KEY);
    if (!raw) return defaultProducts;
    return sanitizeProducts(JSON.parse(raw)) ?? defaultProducts;
  } catch {
    return defaultProducts;
  }
}

export function saveCatalogProducts(next: Product[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(next));
}

export function resetCatalogProducts() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CATALOG_STORAGE_KEY);
}

export function useCatalogProducts() {
  const [items, setItems] = useState<Product[]>(defaultProducts);
  useEffect(() => {
    setItems(getCatalogProducts());
  }, []);
  return {
    items,
    persist: (next: Product[]) => {
      saveCatalogProducts(next);
      setItems(next);
    },
    reset: () => {
      resetCatalogProducts();
      setItems(defaultProducts);
    },
  };
}
