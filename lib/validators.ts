// Pure validators shared by API routes (no "use client" — safe on server).
// Client stores mirror this logic for offline sanitize.

export type ProductSizeInput = { label: string; price: number };

export function sanitizeProductsData(list: unknown) {
  if (!Array.isArray(list) || list.length === 0) return null;
  const out: Record<string, unknown>[] = [];
  for (const p of list) {
    if (typeof p !== "object" || p === null) continue;
    const r = p as Record<string, unknown>;
    if (
      typeof r.sku !== "string" ||
      typeof r.slug !== "string" ||
      typeof r.name !== "string"
    ) {
      continue;
    }
    const sizes = Array.isArray(r.sizes)
      ? (r.sizes as unknown[])
          .filter(
            (s): s is ProductSizeInput =>
              typeof s === "object" &&
              s !== null &&
              typeof (s as { label: unknown }).label === "string" &&
              Number.isFinite(Number((s as { price: unknown }).price)),
          )
          .map((s) => ({
            label: String(s.label),
            price: Number(s.price),
          }))
      : undefined;
    const price = Number.isFinite(Number(r.price)) ? Number(r.price) : 0;
    out.push({
      id: String(r.id ?? r.sku),
      sku: String(r.sku),
      slug: String(r.slug),
      name: String(r.name),
      tagline: String(r.tagline ?? ""),
      description: String(r.description ?? ""),
      price,
      sizes:
        sizes && sizes.length > 0
          ? sizes
          : [{ label: "ONE SIZE", price }],
      images: Array.isArray(r.images)
        ? (r.images as unknown[]).map(String).filter(Boolean)
        : [],
      category: String(r.category ?? "uncategorized"),
      specs: Array.isArray(r.specs)
        ? (r.specs as unknown[]).map(String)
        : [],
      isNew: r.isNew === true,
    });
  }
  return out.length > 0 ? out : null;
}

export function sanitizeCouponsData(list: unknown) {
  if (!Array.isArray(list)) return null;
  const out: Record<string, unknown>[] = [];
  for (const c of list) {
    if (typeof c !== "object" || c === null) continue;
    const rec = c as Record<string, unknown>;
    if (typeof rec.code !== "string" || !rec.code.trim()) continue;
    if (rec.kind !== "percent" && rec.kind !== "flat") continue;
    const value = Number(rec.value);
    if (!Number.isFinite(value) || value <= 0) continue;
    const minSubtotal =
      rec.minSubtotal === undefined ? 0 : Number(rec.minSubtotal);
    out.push({
      code: String(rec.code).trim().toUpperCase(),
      kind: rec.kind,
      value,
      minSubtotal:
        Number.isFinite(minSubtotal) && minSubtotal > 0 ? minSubtotal : 0,
      active: rec.active !== false,
    });
  }
  return out;
}

export function sanitizeSettingsData(v: unknown) {
  if (typeof v !== "object" || v === null) return null;
  const r = v as Record<string, unknown>;
  const phone = String(r.whatsappPhone ?? "").replace(/\D/g, "");
  const email = String(r.contactEmail ?? "").trim();
  const insta = String(r.instagramUrl ?? "").trim();
  if (!phone || !email) return null;
  return {
    whatsappPhone: phone,
    contactEmail: email,
    instagramUrl: insta || "https://instagram.com",
  };
}
