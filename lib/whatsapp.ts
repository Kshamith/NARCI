import type { Product } from "@/data/products";
import { formatINR } from "@/lib/format";

// WhatsApp Business number, digits only with country code. Change via /admin → Settings.
export const WHATSAPP_PHONE = "918618425359";

export type OrderLine = {
  sku: string;
  qty: number;
  name: string;
  price: number;
  size?: string;
};

export function buildOrderMessage(
  lines: OrderLine[],
  total: number,
  opts?: { coupon?: string; discount?: number; subtotal?: number },
) {
  const items = lines
    .map(
      (line) =>
        `- ${line.sku}${line.size ? ` (${line.size})` : ""} x${line.qty} — ${line.name} — ${formatINR(line.price * line.qty)}`,
    )
    .join("\n");

  const couponBit =
    opts?.coupon && (opts?.discount ?? 0) > 0
      ? `\nCoupon: ${opts.coupon} (−${formatINR(opts.discount ?? 0)})`
      : "";

  const subtotalBit =
    opts?.subtotal !== undefined && opts.subtotal !== total
      ? `\nSubtotal: ${formatINR(opts.subtotal ?? total)}`
      : "";

  return `Hi NARCI, I'd like to order:\n${items}${subtotalBit}${couponBit}\nTotal: ${formatINR(total)}`;
}

export function openWhatsAppOrder(
  productsBySku: Map<string, Product>,
  cart: { sku: string; qty: number; size?: string }[],
  opts?: { coupon?: string; discount?: number; subtotal?: number },
) {
  const lines: OrderLine[] = [];
  let subtotal = 0;

  for (const item of cart) {
    const product = productsBySku.get(item.sku);
    if (!product) continue;
    const sizes = product.sizes && product.sizes.length > 0 ? product.sizes : undefined;
    const unit = item.size
      ? (sizes?.find((s) => s.label.toLowerCase() === item.size?.toLowerCase())?.price ?? product.price)
      : (sizes?.[0]?.price ?? product.price);
    lines.push({
      sku: product.sku,
      qty: item.qty,
      name: product.name,
      price: unit,
      size: item.size,
    });
    subtotal += unit * item.qty;
  }

  const discount = Math.min(opts?.discount ?? 0, subtotal);
  const total = Math.max(0, (opts?.subtotal ?? subtotal) - discount);

  const text = encodeURIComponent(
    buildOrderMessage(lines, opts?.subtotal !== undefined ? total : subtotal, {
      coupon: opts?.coupon,
      discount,
      subtotal: opts?.subtotal ?? subtotal,
    }),
  );
  const url = `https://wa.me/${WHATSAPP_PHONE}?text=${text}`;
  window.open(url, "_blank");
}
