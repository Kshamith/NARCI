"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/ProductDetail";
import { useCatalogProducts } from "@/lib/catalog-store";

/**
 * Resolves admin-console products (stored in browser localStorage) that the
 * server static catalog doesn't know about. Renders the real 404 only once
 * the merged catalog has hydrated and the slug is still missing.
 */
export function AdminProductPage({ slug }: { slug: string }) {
  const { items } = useCatalogProducts();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="px-4 py-20 md:px-6">
        <p className="font-display text-3xl uppercase">Loading…</p>
      </div>
    );
  }

  const product = items.find((p) => p.slug === slug);
  if (!product) notFound();

  const related = items.filter((p) => p.slug !== slug).slice(0, 3);
  return (
    <div>
      <div className="border-b border-ink px-4 py-2 md:px-6">
        <Link
          href="/admin"
          className="font-sans text-[10px] uppercase tracking-[0.16em] text-ink/60 underline underline-offset-4 hover:text-blood"
        >
          Added via Admin — manage in console
        </Link>
      </div>
      <ProductDetail product={product} related={related} />
    </div>
  );
}
