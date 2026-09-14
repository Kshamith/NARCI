"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { AddToBagButton } from "@/components/AddToBagButton";
import { NewBadge } from "@/components/NewBadge";
import { ProductVisual } from "@/components/ProductVisual";
import { FEATURED_SKU } from "@/data/products";
import { getFromPrice, getSizes } from "@/data/products";
import { useCatalogProducts } from "@/lib/catalog-store";
import { formatINR } from "@/lib/format";

const snap = { duration: 0.28, ease: [0.4, 0, 1, 1] as const };

export function HomeHero() {
  const { items } = useCatalogProducts();
  const featured =
    items.find((p) => p.sku === FEATURED_SKU) ?? items[0] ?? null;
  if (!featured) return null;
  const teasers = items.filter((p) => p.sku !== featured.sku).slice(0, 4);
  const sizes = getSizes(featured);
  const sizeText =
    sizes.length > 1
      ? sizes.map((s) => s.label).join(" / ")
      : (sizes[0]?.label ?? "ONE SIZE");

  return (
    <div>
      <section className="flex min-h-[calc(100svh-3.5rem)] flex-col border-b border-ink">
        <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-x-clip">
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={snap}
            aria-label="NARCI"
            className="pointer-events-none absolute inset-x-[-4%] top-1/2 z-0 -translate-y-[58%] select-none text-center font-display text-[32vw] leading-[0.72] tracking-[-0.07em] text-ink"
          >
            NARCI
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={snap}
            className="relative z-10 mx-auto w-[min(58vw,380px)]"
          >
            <ProductVisual
              product={featured}
              overlayName={false}
              className="aspect-[5/6]"
            />
          </motion.div>
        </div>

        <div className="grid border-t border-ink md:grid-cols-[1.4fr_0.7fr_0.7fr_1.1fr]">
          <div className="border-b border-ink px-4 py-4 md:border-b-0 md:border-r">
            <div className="flex items-center gap-2">
              <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-ink/60">
                {featured.sku}
              </p>
              {featured.isNew ? <NewBadge /> : null}
            </div>
            <p className="mt-1 font-display text-2xl uppercase leading-none">
              {featured.name}
            </p>
            <p className="mt-2 font-sans text-sm">{featured.tagline}</p>
          </div>
          <div className="border-b border-ink px-4 py-4 md:border-b-0 md:border-r">
            <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-ink/60">
              Size{sizes.length > 1 ? "s" : ""}
            </p>
            <p className="mt-1 font-sans text-sm font-medium">{sizeText}</p>
          </div>
          <div className="border-b border-ink px-4 py-4 md:border-b-0 md:border-r">
            <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-ink/60">
              Price
            </p>
            <p className="mt-1 font-sans text-sm font-medium">
              {sizes.length > 1
                ? `FROM ${formatINR(getFromPrice(featured))}`
                : formatINR(getFromPrice(featured))}
            </p>
          </div>
          <AddToBagButton
            sku={featured.sku}
            className="h-full min-h-[56px] w-full px-4"
          >
            Add to Bag
          </AddToBagButton>
        </div>
      </section>

      <section className="border-b border-ink">
        <div className="flex items-end justify-between px-4 py-6 md:px-6">
          <h2 className="font-display text-3xl uppercase leading-none md:text-5xl">
            More steel
          </h2>
          <Link
            href="/shop"
            className="font-sans text-[11px] uppercase tracking-[0.18em] underline"
          >
            Full catalog
          </Link>
        </div>
        <div className="flex gap-0 overflow-x-auto border-t border-ink">
          {teasers.map((p) => (
            <Link
              key={p.sku}
              href={`/shop/${p.slug}`}
              className="min-w-[280px] flex-1 border-r border-ink last:border-r-0"
            >
              <div className="relative">
                <ProductVisual product={p} className="aspect-[4/5]" />
                {p.isNew ? (
                  <div className="absolute left-3 top-3">
                    <NewBadge />
                  </div>
                ) : null}
              </div>
              <div className="border-t border-ink px-4 py-3">
                <p className="font-display text-xl uppercase leading-none">
                  {p.name}
                </p>
                <p className="mt-2 font-sans text-sm">{formatINR(p.price)}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-b border-ink px-4 py-20 md:px-6 md:py-28">
        <p className="font-display text-[11vw] uppercase leading-[0.85] tracking-tight">
          Rebellious.
          <br />
          Unbreakable.
          <br />
          Power.
        </p>
        <p className="mt-10 max-w-xl font-sans text-base leading-relaxed md:text-lg">
          NARCI builds wall pieces for people who do not decorate. Framed
          weapons. Motorsport wreckage. Blades. If it looks like a gift shop,
          it is not us.
        </p>
      </section>
    </div>
  );
}
