import type { Metadata } from "next";
import fs from "node:fs/promises";
import path from "node:path";
import { AdminProductPage } from "@/components/AdminProductPage";
import { ProductDetail } from "@/components/ProductDetail";
import { getProductBySlug, getRelated, products } from "@/data/products";
import type { Product } from "@/data/products";

type Params = { slug: string };

// Admin-console products live in the shared JSON file, so unknown slugs
// must resolve client-side instead of 404ing at build/request time.
export const dynamicParams = true;

async function readSharedProducts(): Promise<Product[]> {
  try {
    const raw = await fs.readFile(
      path.join(process.cwd(), "public", "data", "products.json"),
      "utf8",
    );
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Product[]) : products;
  } catch {
    return products;
  }
}

export async function generateStaticParams() {
  const shared = await readSharedProducts();
  return shared.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const shared = await readSharedProducts();
  const product =
    shared.find((p) => p.slug === params.slug) ?? getProductBySlug(params.slug);
  if (!product) return { title: "Shop" };
  return {
    title: product.name,
    description: product.tagline,
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const shared = await readSharedProducts();
  const product =
    shared.find((p) => p.slug === params.slug) ?? getProductBySlug(params.slug);
  if (!product) return <AdminProductPage slug={params.slug} />;
  const related =
    shared.filter((p) => p.slug !== product.slug).slice(0, 3).length > 0
      ? shared.filter((p) => p.slug !== product.slug).slice(0, 3)
      : getRelated(product.slug);
  return <ProductDetail product={product} related={related} />;
}
