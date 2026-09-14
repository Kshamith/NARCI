"use client";

import type { Product } from "@/data/products";

/**
 * Flip to true when real photography lands in /public/products/
 * at the paths listed on each product. Until then: branded blocks.
 */
const USE_REAL_PHOTOS = false;

const ANGLE_LABELS = ["FRONT", "SIDE", "DETAIL"] as const;

type Props = {
  product: Product;
  angle?: number;
  className?: string;
  overlayName?: boolean;
};

export function ProductVisual({
  product,
  angle = 0,
  className = "",
  overlayName = true,
}: Props) {
  const src = product.images[angle] ?? product.images[0];
  const label = ANGLE_LABELS[angle % ANGLE_LABELS.length];
  const inverted = product.id === "3" || product.id === "5";

  if (USE_REAL_PHOTOS) {
    return (
      <div className={`relative overflow-hidden bg-bone ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={product.name}
          className="h-full w-full object-contain"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden ${inverted ? "bg-ink text-bone" : "bg-bone text-ink"} ${className}`}
    >
      <div
        className={`pointer-events-none absolute inset-0 opacity-[0.12] ${
          inverted ? "bg-[repeating-linear-gradient(90deg,#F2EFEA_0_1px,transparent_1px_28px)]" : "bg-[repeating-linear-gradient(0deg,#0A0A0A_0_1px,transparent_1px_32px)]"
        }`}
      />
      <div className="absolute left-3 top-3 z-10 font-sans text-[10px] font-medium uppercase tracking-[0.18em]">
        {product.sku} / {label}
      </div>
      {overlayName ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center p-6">
          <p className="max-w-[90%] text-center font-display text-2xl uppercase leading-[0.9] tracking-tight sm:text-3xl">
            {product.name}
          </p>
        </div>
      ) : null}
      <div className="absolute bottom-3 right-3 z-10 font-sans text-[10px] uppercase tracking-[0.18em] opacity-70">
        PLACEHOLDER
      </div>
    </div>
  );
}
