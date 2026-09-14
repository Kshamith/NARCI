import type { Metadata } from "next";
import { AdminProductPage } from "@/components/AdminProductPage";
import { ProductDetail } from "@/components/ProductDetail";
import { getProductBySlug, getRelated, products } from "@/data/products";

type Params = { slug: string };

// Admin-console products live in browser localStorage, so unknown slugs
// must resolve client-side instead of 404ing at build/request time.
export const dynamicParams = true;

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({
  params,
}: {
  params: Params;
}): Metadata {
  const product = getProductBySlug(params.slug);
  if (!product) return { title: "Shop" };
  return {
    title: product.name,
    description: product.tagline,
  };
}

export default function ProductPage({ params }: { params: Params }) {
  const product = getProductBySlug(params.slug);
  if (!product) return <AdminProductPage slug={params.slug} />;
  return <ProductDetail product={product} related={getRelated(product.slug)} />;
}
