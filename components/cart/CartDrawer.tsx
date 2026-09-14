"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { ProductVisual } from "@/components/ProductVisual";
import { useCart } from "@/components/cart/useCart";
import { formatINR } from "@/lib/format";
import { getCatalogProducts } from "@/lib/catalog-store";
import { applyCoupon, normalizeCode } from "@/lib/coupons";
import { appendOrderLog } from "@/lib/orders";
import { openWhatsAppOrder } from "@/lib/whatsapp";

const snap = { duration: 0.22, ease: [0.4, 0, 1, 1] as const };

export function CartDrawer() {
  const {
    isOpen,
    setOpen,
    resolved,
    setQty,
    remove,
    subtotal,
    discount,
    total,
    couponCode,
    setCouponCode,
    clearCoupon,
    couponError,
    lines,
  } = useCart();
  const [draft, setDraft] = useState("");
  const [applyError, setApplyError] = useState<string | undefined>(undefined);

  const couponApplied = Boolean(couponCode) && !couponError && discount > 0;

  function apply() {
    const result = applyCoupon(subtotal, draft);
    if (result.error || !result.coupon) {
      // Invalid code: keep the input visible with the error.
      // Never store it as "applied".
      setApplyError(result.error ?? "Invalid coupon code.");
      return;
    }
    setApplyError(undefined);
    setCouponCode(draft);
    setDraft("");
  }

  // A stored code can go stale (bag shrinks below its minimum, or an
  // admin disables/deletes it). Drop it instead of showing "applied".
  useEffect(() => {
    if (couponCode && couponError) {
      clearCoupon();
    }
  }, [couponCode, couponError, clearCoupon]);

  function order() {
    const validCoupon = couponApplied ? couponCode : undefined;
    const validDiscount = couponApplied ? discount : 0;
    const map = new Map(getCatalogProducts().map((p) => [p.sku, p]));
    appendOrderLog({
      at: new Date().toISOString(),
      lines: resolved.map((r) => ({
        sku: r.product.sku,
        name: r.product.name,
        size: r.sizeLabel,
        qty: r.line.qty,
        unitPrice: r.unitPrice,
      })),
      coupon: validCoupon || undefined,
      discount: validDiscount,
      subtotal,
      total: subtotal - validDiscount,
    });
    openWhatsAppOrder(map, lines, {
      coupon: validCoupon || undefined,
      discount: validDiscount,
      subtotal,
    });
  }

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.button
            type="button"
            aria-label="Close cart"
            className="fixed inset-0 z-50 bg-ink/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={snap}
            onClick={() => setOpen(false)}
          />
          <motion.aside
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-ink bg-bone"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={snap}
          >
            <div className="flex h-12 items-center justify-between border-b border-ink px-4 md:h-14">
              <p className="font-sans text-[11px] font-medium uppercase tracking-[0.2em]">
                Bag
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="font-sans text-[11px] uppercase tracking-[0.18em]"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {resolved.length === 0 ? (
                <div className="px-4 py-16">
                  <p className="font-display text-3xl uppercase leading-none">
                    Empty.
                  </p>
                  <p className="mt-3 font-sans text-sm">
                    Nothing in the bag. That is not a flex.
                  </p>
                  <Link
                    href="/shop"
                    onClick={() => setOpen(false)}
                    className="mt-8 inline-block border border-ink px-4 py-2 font-sans text-[11px] uppercase tracking-[0.18em]"
                  >
                    Shop
                  </Link>
                </div>
              ) : (
                <ul>
                  {resolved.map(({ line, product, unitPrice, sizeLabel }) => (
                    <li
                      key={`${product.sku}__${sizeLabel ?? ""}`}
                      className="grid grid-cols-[88px_1fr] gap-3 border-b border-ink p-4"
                    >
                      <ProductVisual
                        product={product}
                        className="h-[88px] w-[88px] border border-ink"
                        overlayName={false}
                      />
                      <div>
                        <p className="font-display text-lg uppercase leading-none">
                          {product.name}
                        </p>
                        <p className="mt-1 font-sans text-[10px] uppercase tracking-[0.16em] text-ink/70">
                          {product.sku}
                          {sizeLabel ? ` / ${sizeLabel}` : ""}
                        </p>
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center border border-ink">
                            <button
                              type="button"
                              className="h-8 w-8 font-sans text-sm"
                              onClick={() =>
                                setQty(product.sku, line.qty - 1, line.size)
                              }
                            >
                              −
                            </button>
                            <span className="w-8 text-center font-sans text-sm">
                              {line.qty}
                            </span>
                            <button
                              type="button"
                              className="h-8 w-8 font-sans text-sm"
                              onClick={() =>
                                setQty(product.sku, line.qty + 1, line.size)
                              }
                            >
                              +
                            </button>
                          </div>
                          <p className="font-sans text-sm">
                            {formatINR(unitPrice * line.qty)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => remove(product.sku, line.size)}
                          className="mt-2 font-sans text-[10px] uppercase tracking-[0.16em] underline"
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {resolved.length > 0 ? (
              <div className="border-t border-ink p-4">
                <div className="mb-3">
                  <label
                    htmlFor="coupon"
                    className="font-sans text-[10px] uppercase tracking-[0.18em] text-ink/70"
                  >
                    Coupon code
                  </label>
                  {couponApplied ? (
                    <div className="mt-2 flex items-center justify-between border border-ink px-3 py-2">
                      <span className="font-sans text-sm font-medium uppercase tracking-[0.12em]">
                        {couponCode} applied
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          clearCoupon();
                          setDraft("");
                          setApplyError(undefined);
                        }}
                        className="font-sans text-[10px] uppercase tracking-[0.16em] underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="mt-2 flex gap-2">
                      <input
                        id="coupon"
                        value={draft}
                        onChange={(e) => {
                          setDraft(e.target.value.toUpperCase());
                          setApplyError(undefined);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") apply();
                        }}
                        placeholder="TRY NARCI10"
                        className="min-w-0 flex-1 border border-ink bg-bone px-3 py-2 font-sans text-sm uppercase tracking-[0.12em] outline-none placeholder:text-ink/40"
                      />
                      <button
                        type="button"
                        onClick={apply}
                        disabled={!normalizeCode(draft)}
                        className="border border-ink px-4 py-2 font-sans text-[11px] uppercase tracking-[0.18em] disabled:opacity-40"
                      >
                        Apply
                      </button>
                    </div>
                  )}
                  {applyError ?? couponError ? (
                    <p className="mt-2 font-sans text-xs text-blood">
                      {applyError ?? couponError}
                    </p>
                  ) : null}
                </div>
                <div className="mb-1 flex justify-between font-sans text-sm uppercase tracking-[0.12em]">
                  <span>Subtotal</span>
                  <span>{formatINR(subtotal)}</span>
                </div>
                {discount > 0 ? (
                  <div className="mb-1 flex justify-between font-sans text-sm uppercase tracking-[0.12em] text-blood">
                    <span>Discount{couponCode ? ` (${couponCode})` : ""}</span>
                    <span>−{formatINR(discount)}</span>
                  </div>
                ) : null}
                <div className="mb-4 flex justify-between font-sans text-sm font-medium uppercase tracking-[0.12em]">
                  <span>Total</span>
                  <span>{formatINR(total)}</span>
                </div>
                <button
                  type="button"
                  onClick={order}
                  className="w-full bg-blood py-3 font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-bone"
                >
                  Order via WhatsApp
                </button>
              </div>
            ) : null}
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
