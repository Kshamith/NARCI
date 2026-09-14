import Link from "next/link";

export default function NotFound() {
  return (
    <div className="border-b border-ink px-4 py-24 md:px-6">
      <h1 className="font-display text-6xl uppercase leading-none">404</h1>
      <p className="mt-4 font-sans text-sm">This page does not exist.</p>
      <Link
        href="/shop"
        className="mt-8 inline-block border border-ink px-4 py-3 font-sans text-[11px] uppercase tracking-[0.18em]"
      >
        Shop
      </Link>
    </div>
  );
}
