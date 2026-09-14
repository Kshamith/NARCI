"use client";

import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/data/products";
import { getFromPrice, getSizes } from "@/data/products";
import { ProductVisual } from "@/components/ProductVisual";
import { formatINR } from "@/lib/format";

export function ShopCard({ product }: { product: Product }) {
  const [angle, setAngle] = useState(0);
  const sizes = getSizes(product);

  return (
    <article className="flex h-full flex-col border border-ink bg-bone">
      <Link
        href={`/shop/${product.slug}`}
        className="block"
        onMouseEnter={() => {
          setAngle(1 % product.images.length);
        }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width;
          const idx = Math.min(
            product.images.length - 1,
            Math.floor(x * product.images.length),
          );
          setAngle(idx);
        }}
        onMouseLeave={() => setAngle(0)}
      >
        <div className="px-4 pt-5">
          <h2
            title={product.name}
            className="line-clamp-2 min-h-[2em] font-display text-4xl uppercase leading-none tracking-tight md:text-5xl"
          >
            {product.name}
          </h2>
          <p className="mt-2 font-sans text-[11px] uppercase tracking-[0.18em] text-ink/70">
            {product.category.replace("-", " ")}
          </p>
        </div>
        <ProductVisual
          product={product}
          angle={angle}
          className="mx-4 my-6 aspect-[4/3]"
        />
      </Link>
      <p
        title={product.tagline}
        className="line-clamp-1 min-h-[1.5rem] border-t border-ink px-4 py-3 font-sans text-sm"
      >
        {product.tagline}
      </p>
      <dl className="grid grid-cols-3 border-t border-ink">
        {product.specs.slice(0, 3).map((spec, i) => {
          const labels = ["Material", "Dimensions", "Mount"];
          return (
            <div
              key={spec}
              className="border-r border-ink px-3 py-3 last:border-r-0"
            >
              <dt className="font-sans text-[10px] uppercase tracking-[0.14em] text-ink/60">
                {labels[i] ?? "Spec"}
              </dt>
              <dd
                title={spec}
                className="line-clamp-2 mt-1 min-h-[2em] font-sans text-xs font-medium leading-snug"
              >
                {spec}
              </dd>
            </div>
          );
        })}
      </dl>
      <div className="mt-auto">
      <div className="flex items-center justify-between border-t border-ink px-4 py-3 font-sans text-sm">
        <span>
          {sizes.length > 1 ? `FROM ${formatINR(getFromPrice(product))}` : formatINR(getFromPrice(product))}
        </span>
        <span className="text-[10px] uppercase tracking-[0.16em]">{product.sku}</span>
      </div>
      {sizes.length > 1 ? (
        <p className="line-clamp-1 border-t border-ink px-4 py-2 font-sans text-[10px] uppercase tracking-[0.16em] text-ink/70">
          {sizes.length} sizes: {sizes.map((s) => s.label).join(" / ")}
        </p>
      ) : (
        <p className="border-t border-ink px-4 py-2 font-sans text-[10px] uppercase tracking-[0.16em] text-ink/70">
          {sizes[0]?.label ?? "ONE SIZE"}
        </p>
      )}
      <Link
        href={`/shop/${product.slug}`}
        className="block bg-ink py-3 text-center font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-bone"
      >
        View
      </Link>
      </div>
    </article>
  );
}
