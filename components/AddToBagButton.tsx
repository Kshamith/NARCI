"use client";

import { useCart } from "@/components/cart/useCart";

type Props = {
  sku: string;
  qty?: number;
  size?: string;
  className?: string;
  children?: React.ReactNode;
};

export function AddToBagButton({
  sku,
  qty = 1,
  size,
  className = "",
  children = "Add to Bag",
}: Props) {
  const { add } = useCart();

  return (
    <button
      type="button"
      onClick={() => add(sku, qty, size)}
      className={`inline-flex items-center justify-center bg-blood font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-bone ${className}`}
    >
      {children}
    </button>
  );
}
