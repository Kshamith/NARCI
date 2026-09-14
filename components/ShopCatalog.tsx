"use client";

import { useMemo, useState } from "react";
import { ShopCard } from "@/components/ShopCard";
import { getFromPrice } from "@/data/products";
import { useCatalogProducts } from "@/lib/catalog-store";

export function ShopCatalog() {
  const { items } = useCatalogProducts();
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("featured");

  const categories = useMemo(
    () => Array.from(new Set(items.map((p) => p.category))),
    [items],
  );

  const list = useMemo(() => {
    let next = [...items];
    if (category !== "all") {
      next = next.filter((p) => p.category === category);
    }
    if (sort === "price-asc")
      next.sort((a, b) => getFromPrice(a) - getFromPrice(b));
    if (sort === "price-desc")
      next.sort((a, b) => getFromPrice(b) - getFromPrice(a));
    return next;
  }, [category, sort, items]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-ink px-4 py-8 md:px-6">
        <h1 className="font-display text-5xl uppercase leading-none tracking-tight md:text-7xl">
          Select a
          <br />
          Model Series
        </h1>
        <div className="flex gap-3 font-sans text-[11px] uppercase tracking-[0.16em]">
          <label className="flex items-center gap-2">
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="border border-ink bg-bone px-2 py-2 outline-none"
            >
              <option value="all">All</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c.replace("-", " ")}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2">
            Sort
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="border border-ink bg-bone px-2 py-2 outline-none"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price ↑</option>
              <option value="price-desc">Price ↓</option>
            </select>
          </label>
        </div>
      </div>
      <div className="grid gap-6 p-4 md:grid-cols-2 md:p-6">
        {list.map((p) => (
          <ShopCard key={p.sku} product={p} />
        ))}
      </div>
    </div>
  );
}
