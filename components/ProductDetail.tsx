"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AddToBagButton } from "@/components/AddToBagButton";
import { ProductVisual } from "@/components/ProductVisual";
import type { Product } from "@/data/products";
import { getFromPrice, getSizes } from "@/data/products";
import { useCatalogProducts } from "@/lib/catalog-store";
import { formatINR } from "@/lib/format";

export function ProductDetail({
  product,
  related,
}: {
  product: Product;
  related: Product[];
}) {
  const [angle, setAngle] = useState(0);
  const [qty, setQty] = useState(1);
  // Merge admin-console edits (new sizes, price/name changes) stored in
  // localStorage over the server-passed snapshot.
  const { items } = useCatalogProducts();
  const live = items.find((p) => p.sku === product.sku) ?? product;
  const sizes = getSizes(live);
  const [sizeLabel, setSizeLabel] = useState(sizes[0]?.label ?? "ONE SIZE");
  // Reset selection when navigating to another product or when the
  // available sizes change (e.g. admin adds/removes a size).
  useEffect(() => {
    setSizeLabel((prev) =>
      sizes.some((s) => s.label === prev)
        ? prev
        : (sizes[0]?.label ?? "ONE SIZE"),
    );
    setQty(1);
    setAngle(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live.sku, live.sizes]);
  const selected = sizes.find((s) => s.label === sizeLabel) ?? sizes[0];
  const unitPrice = selected?.price ?? live.price;

  return (
    <div>
      <div className="flex items-center justify-between border-b border-ink px-4 py-3 md:px-6">
        <Link
          href="/shop"
          className="font-sans text-[11px] font-medium uppercase tracking-[0.18em] underline underline-offset-4 hover:text-blood"
        >
          ← Back to Shop
        </Link>
        <p className="font-sans text-[10px] uppercase tracking-[0.16em] text-ink/60">
          Shop / {live.name}
        </p>
      </div>
      <div className="grid border-b border-ink lg:grid-cols-2">
        <div className="border-b border-ink lg:border-b-0 lg:border-r">
          <ProductVisual
            product={live}
            angle={angle}
            className="aspect-square min-h-[420px]"
          />
          <div className="grid grid-cols-3 border-t border-ink">
            {live.images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setAngle(i)}
                className={`border-r border-ink last:border-r-0 ${angle === i ? "bg-ink text-bone" : "bg-bone"}`}
              >
                <ProductVisual
                  product={live}
                  angle={i}
                  overlayName={false}
                  className="aspect-[4/3]"
                />
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col p-6 md:p-10">
          <p className="font-sans text-[11px] uppercase tracking-[0.2em]">
            {live.sku}
          </p>
          <h1 className="mt-3 font-display text-5xl uppercase leading-[0.9] tracking-tight md:text-7xl">
            {live.name}
          </h1>
          <p className="mt-4 font-sans text-lg">{live.tagline}</p>
          <p className="mt-8 font-sans text-sm leading-relaxed">
            {live.description}
          </p>
          <div className="mt-8">
            <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-ink/60">
              Size
            </p>
            {sizes.length > 1 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => setSizeLabel(s.label)}
                    aria-pressed={s.label === sizeLabel}
                    className={`border border-ink px-4 py-2 font-sans text-[11px] uppercase tracking-[0.16em] ${
                      s.label === sizeLabel
                        ? "bg-ink text-bone"
                        : "bg-bone hover:bg-ink/5"
                    }`}
                  >
                    {s.label} · {formatINR(s.price)}
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-2 font-sans text-sm font-medium uppercase tracking-[0.12em]">
                {sizes[0]?.label ?? "ONE SIZE"} · {formatINR(unitPrice)}
              </p>
            )}
          </div>
          <ul className="mt-8 border-y border-ink">
            {live.specs.map((s) => (
              <li
                key={s}
                className="border-b border-ink px-0 py-3 font-sans text-sm last:border-b-0"
              >
                {s}
              </li>
            ))}
          </ul>
          <p className="mt-8 font-display text-4xl">{formatINR(unitPrice)}</p>
          <div className="mt-6 flex items-stretch gap-0">
            <div className="flex items-center border border-ink">
              <button
                type="button"
                className="h-12 w-12"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
              >
                −
              </button>
              <span className="w-10 text-center font-sans">{qty}</span>
              <button
                type="button"
                className="h-12 w-12"
                onClick={() => setQty((q) => q + 1)}
              >
                +
              </button>
            </div>
            <AddToBagButton
              sku={live.sku}
              qty={qty}
              size={sizes.length > 1 ? sizeLabel : undefined}
              className="flex-1 px-6"
            >
              Add to Bag
            </AddToBagButton>
          </div>
        </div>
      </div>
      <section>
        <h2 className="border-b border-ink px-4 py-5 font-display text-3xl uppercase md:px-6">
          Related
        </h2>
        <div className="grid md:grid-cols-3">
          {related.map((p) => (
            <Link
              key={p.sku}
              href={`/shop/${p.slug}`}
              className="border-b border-ink md:border-r md:last:border-r-0"
            >
              <ProductVisual product={p} className="aspect-[4/3]" />
              <div className="border-t border-ink px-4 py-3">
                <p className="font-display text-xl uppercase">{p.name}</p>
                <p className="mt-1 font-sans text-sm">{formatINR(getFromPrice(p))}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
