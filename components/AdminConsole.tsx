"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Product, ProductSize } from "@/data/products";
import { useCatalogProducts } from "@/lib/catalog-store";
import { normalizeCode } from "@/lib/coupons";
import type { Coupon } from "@/lib/coupons";
import { useCoupons } from "@/lib/coupons";
import {
  ORDER_LOG_KEY,
  readOrderLog,
  readSharedOrderLog,
} from "@/lib/orders";
import type { OrderLogEntry } from "@/lib/orders";
import { useSiteSettings } from "@/lib/site-settings";
import { formatINR } from "@/lib/format";

const AUTH_KEY = "narci-admin-auth";
const PIN_KEY = "narci-admin-pin";
const EXPECTED_PIN =
  process.env.NEXT_PUBLIC_ADMIN_PIN && process.env.NEXT_PUBLIC_ADMIN_PIN.length > 0
    ? process.env.NEXT_PUBLIC_ADMIN_PIN
    : "narci123";

type Tab = "products" | "coupons" | "orders" | "settings";

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

/** PIN entered at unlock, reused for API saves (never persisted beyond session). */
function getStoredPin(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.sessionStorage.getItem(PIN_KEY) ?? "";
  } catch {
    return "";
  }
}

function copyJson(label: string, value: unknown) {
  const text = JSON.stringify(value, null, 2);
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(() => {
      /* ignore */
    });
  }
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${label}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

const emptySize = (price: number): ProductSize => ({ label: "", price });

export function AdminConsole() {
  const [authed, setAuthed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.sessionStorage.getItem(AUTH_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [tab, setTab] = useState<Tab>("products");

  function unlock() {
    if (pin === EXPECTED_PIN) {
      try {
        window.sessionStorage.setItem(AUTH_KEY, "1");
        window.sessionStorage.setItem(PIN_KEY, pin);
      } catch {
        /* ignore */
      }
      setAuthed(true);
      setPinError("");
    } else {
      setPinError("Wrong PIN.");
    }
  }

  if (!authed) {
    return (
      <div className="mx-auto max-w-md px-4 py-20">
        <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-ink/60">
          Restricted
        </p>
        <h1 className="mt-2 font-display text-4xl uppercase">Admin</h1>
        <p className="mt-3 font-sans text-sm leading-relaxed">
          Enter the admin PIN to manage products, sizes, coupons and view
          order activity.{" "}
          {!process.env.NEXT_PUBLIC_ADMIN_PIN ? (
            <span className="text-ink/70">
              (No NEXT_PUBLIC_ADMIN_PIN set — demo PIN is <code>narci123</code>.
              Set a real PIN in production.)
            </span>
          ) : null}
        </p>
        <div className="mt-6 flex gap-2">
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") unlock();
            }}
            placeholder="PIN"
            className="min-w-0 flex-1 border border-ink bg-bone px-3 py-2 font-sans text-sm outline-none"
          />
          <button
            type="button"
            onClick={unlock}
            className="bg-ink px-5 py-2 font-sans text-[11px] uppercase tracking-[0.18em] text-bone"
          >
            Unlock
          </button>
        </div>
        {pinError ? (
          <p className="mt-2 font-sans text-xs text-blood">{pinError}</p>
        ) : null}
        <Link
          href="/shop"
          className="mt-8 inline-block font-sans text-[11px] uppercase tracking-[0.18em] underline"
        >
          ← Back to Shop
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-ink px-4 py-8 md:px-6">
        <div>
          <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-ink/60">
            <Link href="/shop" className="underline underline-offset-4 hover:text-blood">
              ← Shop
            </Link>{" "}
            / Admin
          </p>
          <h1 className="mt-2 font-display text-5xl uppercase leading-none md:text-6xl">
            Manage
          </h1>
          <p className="mt-2 max-w-2xl font-sans text-sm text-ink/70">
            Saving commits the shared JSON files to GitHub (
            <code>kshamith/NARCI</code>) and Vercel redeploys automatically —
            changes then appear on every device. Wait ~1–2 minutes after saving
            and check in an incognito window.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            try {
              window.sessionStorage.removeItem(AUTH_KEY);
              window.sessionStorage.removeItem(PIN_KEY);
            } catch {
              /* ignore */
            }
            setAuthed(false);
            setPin("");
          }}
          className="border border-ink px-4 py-2 font-sans text-[11px] uppercase tracking-[0.18em]"
        >
          Lock
        </button>
      </div>
      <div className="flex flex-wrap gap-2 border-b border-ink px-4 py-3 md:px-6">
        {(["products", "coupons", "orders", "settings"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            aria-pressed={tab === t}
            className={`border border-ink px-4 py-2 font-sans text-[11px] uppercase tracking-[0.18em] ${
              tab === t ? "bg-ink text-bone" : "bg-bone"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="px-4 py-8 md:px-6">
        {tab === "products" ? <ProductsTab /> : null}
        {tab === "coupons" ? <CouponsTab /> : null}
        {tab === "orders" ? <OrdersTab /> : null}
        {tab === "settings" ? <SettingsTab /> : null}
      </div>
    </div>
  );
}

type ProductForm = {
  sku: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  category: string;
  price: string;
  images: string;
  specs: string;
  sizes: ProductSize[];
  isNew: boolean;
};

function blankForm(): ProductForm {
  return {
    sku: "",
    name: "",
    slug: "",
    tagline: "",
    description: "",
    category: "",
    price: "",
    images: "",
    specs: "",
    sizes: [{ label: "ONE SIZE", price: NaN as unknown as number }],
    isNew: false,
  };
}

function formFromProduct(p: Product): ProductForm {
  return {
    sku: p.sku,
    name: p.name,
    slug: p.slug,
    tagline: p.tagline,
    description: p.description,
    category: p.category,
    price: String(p.price),
    images: p.images.join("\n"),
    specs: p.specs.join("\n"),
    sizes:
      p.sizes && p.sizes.length > 0
        ? p.sizes.map((s) => ({ ...s }))
        : [{ label: "ONE SIZE", price: p.price }],
    isNew: p.isNew === true,
  };
}

function ProductsTab() {
  const { items, loaded, persist, reset } = useCatalogProducts();
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<ProductForm>(blankForm());
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Product[] | null>(null);

  function startCreate() {
    setForm(blankForm());
    setCreating(true);
    setEditing(null);
    setError("");
    setStatus("");
  }

  function startEdit(p: Product) {
    setForm(formFromProduct(p));
    setEditing(p.sku);
    setCreating(false);
    setError("");
    setStatus("");
  }

  function validate(): string | null {
    if (!form.sku.trim()) return "SKU is required.";
    if (!form.name.trim()) return "Name is required.";
    const price = Number(form.price);
    if (!Number.isFinite(price) || price <= 0) return "Base price must be > 0.";
    const cleanSizes = form.sizes
      .map((s) => ({ label: s.label.trim(), price: Number(s.price) }))
      .filter((s) => s.label);
    if (cleanSizes.length === 0) return "Add at least one size with a label.";
    for (const s of cleanSizes) {
      if (!Number.isFinite(s.price) || s.price <= 0)
        return `Size "${s.label}" needs a price > 0.`;
    }
    const slug = form.slug.trim() || slugify(form.name);
    const clash = items.find(
      (p) =>
        (p.sku.toLowerCase() === form.sku.trim().toLowerCase() ||
          p.slug === slug) &&
        p.sku !== editing,
    );
    if (clash && !editing) return "SKU or URL slug already exists.";
    if (clash && editing && clash.sku !== editing)
      return "SKU or URL slug already used by another product.";
    return null;
  }

  async function save() {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    const cleanSizes = form.sizes
      .map((s) => ({ label: s.label.trim(), price: Number(s.price) }))
      .filter((s) => s.label);
    const price = Number(form.price);
    const product: Product = {
      id: editing
        ? (items.find((p) => p.sku === editing)?.id ?? form.sku.trim())
        : `admin-${Date.now()}`,
      sku: form.sku.trim(),
      slug: form.slug.trim() || slugify(form.name),
      name: form.name.trim(),
      tagline: form.tagline.trim(),
      description: form.description.trim(),
      price,
      sizes: cleanSizes,
      images: form.images.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean),
      category: form.category.trim() || "uncategorized",
      specs: form.specs.split("\n").map((s) => s.trim()).filter(Boolean),
      isNew: form.isNew,
    };
    let next: Product[];
    if (editing) {
      next = items.map((p) => (p.sku === editing ? product : p));
    } else {
      next = [...items, product];
    }
    setSaving(true);
    setError("");
    setStatus("Saving… committing to GitHub.");
    try {
      const result = await persist(next, getStoredPin());
      setLastSaved(next);
      setCreating(false);
      setEditing(null);
      setStatus(
        result?.committed
          ? "Saved + committed to GitHub. Vercel is redeploying — check the live site in ~1–2 min."
          : "Saved. (Local dev — file written directly.)",
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : "Save failed.";
      setError(message);
      setLastSaved(next);
      setStatus("");
    } finally {
      setSaving(false);
    }
  }

  async function remove(sku: string) {
    if (!window.confirm(`Delete ${sku}? This commits to GitHub.`)) return;
    setSaving(true);
    setError("");
    try {
      const next = items.filter((p) => p.sku !== sku);
      await persist(next, getStoredPin());
      setLastSaved(next);
      if (editing === sku) setEditing(null);
      setStatus("Deleted + committed. Vercel is redeploying.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleNew(p: Product) {
    setSaving(true);
    setError("");
    try {
      const next = items.map((x) =>
        x.sku === p.sku ? { ...x, isNew: !(x.isNew === true) } : x,
      );
      await persist(next, getStoredPin());
      setLastSaved(next);
      setStatus(
        `"${p.name}" NEW sticker ${p.isNew ? "hidden" : "shown"} + committed.`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Toggle failed.");
    } finally {
      setSaving(false);
    }
  }

  const showForm = creating || editing !== null;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-3xl uppercase">
          Products ({items.length}){loaded ? "" : " — loading…"}
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => {
              if (window.confirm("Reset catalog to built-in defaults? This commits to GitHub.")) {
                setSaving(true);
                reset(getStoredPin())
                  .then(() => setStatus("Reset to defaults + committed."))
                  .catch((e: unknown) =>
                    setError(e instanceof Error ? e.message : "Reset failed."),
                  )
                  .finally(() => setSaving(false));
              }
            }}
            className="border border-ink px-4 py-2 font-sans text-[11px] uppercase tracking-[0.18em] disabled:opacity-50"
          >
            Reset defaults
          </button>
          <button
            type="button"
            onClick={startCreate}
            className="bg-ink px-4 py-2 font-sans text-[11px] uppercase tracking-[0.18em] text-bone"
          >
            + New product
          </button>
        </div>
      </div>

      {status ? (
        <p className="mt-4 border border-ink bg-bone p-3 font-sans text-sm">
          {status}
        </p>
      ) : null}

      {showForm ? (
        <div className="mt-6 border border-ink p-4 md:p-6">
          <h3 className="font-display text-2xl uppercase">
            {creating ? "New product" : `Edit ${editing}`}
          </h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1 font-sans text-xs uppercase tracking-[0.12em]">
              Name*
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border border-ink bg-bone px-3 py-2 font-sans text-sm normal-case tracking-normal" />
            </label>
            <label className="flex flex-col gap-1 font-sans text-xs uppercase tracking-[0.12em]">
              SKU* (e.g. NARCI-006)
              <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="border border-ink bg-bone px-3 py-2 font-sans text-sm normal-case tracking-normal" disabled={editing !== null} />
            </label>
            <label className="flex flex-col gap-1 font-sans text-xs uppercase tracking-[0.12em]">
              URL slug (auto from name)
              <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder={slugify(form.name || "product-name")} className="border border-ink bg-bone px-3 py-2 font-sans text-sm normal-case tracking-normal" />
            </label>
            <label className="flex flex-col gap-1 font-sans text-xs uppercase tracking-[0.12em]">
              Category
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="border border-ink bg-bone px-3 py-2 font-sans text-sm normal-case tracking-normal" />
            </label>
            <label className="flex flex-col gap-1 font-sans text-xs uppercase tracking-[0.12em]">
              Tagline
              <input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} className="border border-ink bg-bone px-3 py-2 font-sans text-sm normal-case tracking-normal" />
            </label>
            <label className="flex flex-col gap-1 font-sans text-xs uppercase tracking-[0.12em]">
              Base price (INR)*
              <input value={form.price} inputMode="numeric" onChange={(e) => setForm({ ...form, price: e.target.value })} className="border border-ink bg-bone px-3 py-2 font-sans text-sm normal-case tracking-normal" />
            </label>
            <label className="flex cursor-pointer items-center gap-3 border border-ink p-3 font-sans text-xs uppercase tracking-[0.12em] md:col-span-2">
              <input
                type="checkbox"
                checked={form.isNew}
                onChange={(e) => setForm({ ...form, isNew: e.target.checked })}
                className="h-5 w-5 accent-[#8B0000]"
              />
              <span>
                Show <strong className="bg-blood px-1 text-bone">NEW</strong> sticker
                on this product (shop cards, detail page, home)
              </span>
            </label>
            <label className="flex flex-col gap-1 font-sans text-xs uppercase tracking-[0.12em] md:col-span-2">
              Description
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="border border-ink bg-bone px-3 py-2 font-sans text-sm normal-case tracking-normal" />
            </label>
            <label className="flex flex-col gap-1 font-sans text-xs uppercase tracking-[0.12em]">
              Images (one path per line)
              <textarea value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} rows={3} placeholder="/products/narci-006-01.jpg" className="border border-ink bg-bone px-3 py-2 font-sans text-sm normal-case tracking-normal" />
            </label>
            <label className="flex flex-col gap-1 font-sans text-xs uppercase tracking-[0.12em]">
              Specs (one per line)
              <textarea value={form.specs} onChange={(e) => setForm({ ...form, specs: e.target.value })} rows={3} className="border border-ink bg-bone px-3 py-2 font-sans text-sm normal-case tracking-normal" />
            </label>
          </div>

          <div className="mt-6 border-t border-ink pt-4">
            <div className="flex items-center justify-between">
              <h4 className="font-sans text-xs uppercase tracking-[0.16em]">
                Sizes — each size has its own price
              </h4>
              <button
                type="button"
                onClick={() => setForm({ ...form, sizes: [...form.sizes, emptySize(Number(form.price) || 0)] })}
                className="border border-ink px-3 py-1 font-sans text-[11px] uppercase tracking-[0.16em]"
              >
                + Add size
              </button>
            </div>
            <div className="mt-3 grid gap-2">
              {form.sizes.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={s.label}
                    onChange={(e) => {
                      const sizes = [...form.sizes];
                      sizes[i] = { ...sizes[i], label: e.target.value };
                      setForm({ ...form, sizes });
                    }}
                    placeholder='e.g. S, M, L or "80 × 80 cm"'
                    className="min-w-0 flex-1 border border-ink bg-bone px-3 py-2 font-sans text-sm"
                  />
                  <input
                    value={Number.isNaN(s.price) ? "" : String(s.price)}
                    inputMode="numeric"
                    onChange={(e) => {
                      const sizes = [...form.sizes];
                      sizes[i] = { ...sizes[i], price: Number(e.target.value) };
                      setForm({ ...form, sizes });
                    }}
                    placeholder="₹"
                    className="w-32 border border-ink bg-bone px-3 py-2 font-sans text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, sizes: form.sizes.filter((_, j) => j !== i) })}
                    className="border border-ink px-3 font-sans text-sm"
                    aria-label={`Remove size ${i + 1}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <p className="mt-2 font-sans text-xs text-ink/60">
              Single-size products: keep one row labelled ONE SIZE at the base
              price. Multi-size: one row per variant, each with its own price.
            </p>
          </div>

          {error ? <p className="mt-4 font-sans text-sm text-blood">{error}</p> : null}
          {error && lastSaved ? (
            <button
              type="button"
              onClick={() => copyJson("products", lastSaved)}
              className="mt-2 border border-ink px-4 py-2 font-sans text-[11px] uppercase tracking-[0.18em]"
            >
              Download JSON (commit manually to public/data/products.json)
            </button>
          ) : null}
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={save} disabled={saving} className="bg-blood px-5 py-2 font-sans text-[11px] uppercase tracking-[0.18em] text-bone disabled:opacity-50">
              {saving ? "Saving…" : "Save product"}
            </button>
            <button
              type="button"
              onClick={() => {
                setCreating(false);
                setEditing(null);
                setError("");
              }}
              className="border border-ink px-5 py-2 font-sans text-[11px] uppercase tracking-[0.18em]"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <ul className="mt-6 divide-y divide-ink border-y border-ink">
        {items.map((p) => (
          <li key={p.sku} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div>
              <p className="font-display text-xl uppercase leading-none">
                {p.isNew ? (
                  <span className="mr-2 inline-block bg-blood px-1.5 py-0.5 align-middle font-sans text-[10px] font-bold tracking-[0.2em] text-bone">
                    New
                  </span>
                ) : null}
                {p.name}
              </p>
              <p className="mt-1 font-sans text-[11px] uppercase tracking-[0.14em] text-ink/60">
                {p.sku} · /shop/{p.slug} · {(p.sizes ?? []).map((s) => `${s.label} ${formatINR(s.price)}`).join(" / ") || formatINR(p.price)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/shop/${p.slug}`} className="border border-ink px-3 py-1 font-sans text-[11px] uppercase tracking-[0.16em]">
                View
              </Link>
              <button
                type="button"
                disabled={saving}
                onClick={() => toggleNew(p)}
                className={`border px-3 py-1 font-sans text-[11px] uppercase tracking-[0.16em] disabled:opacity-50 ${p.isNew ? "border-blood bg-blood text-bone" : "border-ink"}`}
              >
                {p.isNew ? "★ New" : "New?"}
              </button>
              <button type="button" onClick={() => startEdit(p)} className="border border-ink px-3 py-1 font-sans text-[11px] uppercase tracking-[0.16em]">
                Edit
              </button>
              <button type="button" onClick={() => remove(p.sku)} className="border border-blood px-3 py-1 font-sans text-[11px] uppercase tracking-[0.16em] text-blood">
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CouponsTab() {
  const { coupons, setCoupons, reset } = useCoupons();
  const [code, setCode] = useState("");
  const [kind, setKind] = useState<"percent" | "flat">("percent");
  const [value, setValue] = useState("");
  const [min, setMin] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  async function persist(next: Coupon[]) {
    setSaving(true);
    setError("");
    try {
      const result = await setCoupons(next, getStoredPin());
      setStatus(
        result?.committed
          ? "Saved + committed. Live after redeploy (~1–2 min)."
          : "Saved.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  function add() {
    const c = normalizeCode(code);
    if (!c) {
      setError("Code is required.");
      return;
    }
    const v = Number(value);
    if (!Number.isFinite(v) || v <= 0) {
      setError("Value must be > 0.");
      return;
    }
    if (kind === "percent" && v > 90) {
      setError("Percent coupons max out at 90%.");
      return;
    }
    if (coupons.some((x) => x.code === c)) {
      setError("That code already exists — toggle or delete it below.");
      return;
    }
    const m = Number(min || 0);
    const next: Coupon[] = [
      ...coupons,
      {
        code: c,
        kind,
        value: v,
        minSubtotal: Number.isFinite(m) && m > 0 ? m : 0,
        active: true,
      },
    ];
    setCode("");
    setValue("");
    setMin("");
    setError("");
    persist(next);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-3xl uppercase">
          Coupons ({coupons.length})
        </h2>
        <button
          type="button"
          disabled={saving}
          onClick={() => {
            if (window.confirm("Reset coupons to defaults (NARCI10, FLAT500)? This commits to GitHub.")) {
              setSaving(true);
              reset(getStoredPin())
                .then(() => setStatus("Reset + committed."))
                .catch((e: unknown) =>
                  setError(e instanceof Error ? e.message : "Reset failed."),
                )
                .finally(() => setSaving(false));
            }
          }}
          className="border border-ink px-4 py-2 font-sans text-[11px] uppercase tracking-[0.18em] disabled:opacity-50"
        >
          Reset defaults
        </button>
      </div>
      {status ? (
        <p className="mt-4 border border-ink p-3 font-sans text-sm">{status}</p>
      ) : null}
      <div className="mt-6 grid gap-2 border border-ink p-4 md:grid-cols-[1fr_140px_140px_140px_auto] md:p-6">
        <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="CODE" className="border border-ink bg-bone px-3 py-2 font-sans text-sm uppercase tracking-[0.12em]" />
        <select value={kind} onChange={(e) => setKind(e.target.value as "percent" | "flat")} className="border border-ink bg-bone px-3 py-2 font-sans text-sm">
          <option value="percent">% off</option>
          <option value="flat">₹ flat off</option>
        </select>
        <input value={value} inputMode="numeric" onChange={(e) => setValue(e.target.value)} placeholder={kind === "percent" ? "10" : "500"} className="border border-ink bg-bone px-3 py-2 font-sans text-sm" />
        <input value={min} inputMode="numeric" onChange={(e) => setMin(e.target.value)} placeholder="Min ₹ (0)" className="border border-ink bg-bone px-3 py-2 font-sans text-sm" />
        <button type="button" onClick={add} disabled={saving} className="bg-ink px-5 py-2 font-sans text-[11px] uppercase tracking-[0.18em] text-bone disabled:opacity-50">
          Add
        </button>
      </div>
      {error ? <p className="mt-2 font-sans text-sm text-blood">{error}</p> : null}
      <ul className="mt-6 divide-y divide-ink border-y border-ink">
        {coupons.map((c) => (
          <li key={c.code} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div>
              <p className="font-display text-xl uppercase">{c.code}</p>
              <p className="mt-1 font-sans text-xs uppercase tracking-[0.12em] text-ink/60">
                {c.kind === "percent" ? `${c.value}% off` : `${formatINR(c.value)} off`}
                {c.minSubtotal ? ` · min ${formatINR(c.minSubtotal)}` : ""} ·{" "}
                {c.active ? "active" : "disabled"}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => persist(coupons.map((x) => (x.code === c.code ? { ...x, active: !x.active } : x)))}
                className="border border-ink px-3 py-1 font-sans text-[11px] uppercase tracking-[0.16em] disabled:opacity-50"
              >
                {c.active ? "Disable" : "Enable"}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => persist(coupons.filter((x) => x.code !== c.code))}
                className="border border-blood px-3 py-1 font-sans text-[11px] uppercase tracking-[0.16em] text-blood disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
        {coupons.length === 0 ? (
          <li className="py-6 font-sans text-sm text-ink/60">
            No coupons. Checkout will show subtotal = total.
          </li>
        ) : null}
      </ul>
    </div>
  );
}

function OrdersTab() {
  const { settings } = useSiteSettings();
  const [localLog, setLocalLog] = useState<OrderLogEntry[]>([]);
  const [sharedLog, setSharedLog] = useState<OrderLogEntry[]>([]);
  const [refresh, setRefresh] = useState(0);
  const [status, setStatus] = useState("");

  useEffect(() => {
    setLocalLog(readOrderLog());
    readSharedOrderLog().then(setSharedLog);
  }, [refresh]);

  return (
    <div>
      <h2 className="font-display text-3xl uppercase">Orders</h2>
      <div className="mt-4 border border-ink p-4 font-sans text-sm leading-relaxed md:p-6">
        <p>
          Checkout is <strong>Order via WhatsApp</strong> — there is no server,
          so completed orders arrive as WhatsApp messages to{" "}
          <code>{settings.whatsappPhone}</code>, not here.
        </p>
        <p className="mt-2 text-ink/70">
          Each WhatsApp message includes size per line, coupon code, discount,
          subtotal and total. Below: the shared log (all devices, after
          redeploy) plus this browser&apos;s local log.
        </p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setRefresh((n) => n + 1)}
          className="border border-ink px-4 py-2 font-sans text-[11px] uppercase tracking-[0.18em]"
        >
          Refresh
        </button>
        <button
          type="button"
          onClick={() => {
            if (!window.confirm("Clear local order log (this browser only)?")) return;
            try {
              window.localStorage.removeItem(ORDER_LOG_KEY);
            } catch {
              /* ignore */
            }
            setRefresh((n) => n + 1);
          }}
          className="border border-ink px-4 py-2 font-sans text-[11px] uppercase tracking-[0.18em]"
        >
          Clear local log
        </button>
        <button
          type="button"
          onClick={async () => {
            if (!window.confirm("Clear the SHARED order log for all devices? This commits to GitHub.")) return;
            setStatus("Clearing…");
            try {
              // POST (not DELETE): some mobile networks/proxies reject DELETE with 405.
              const res = await fetch("/api/orders", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-admin-pin": getStoredPin(),
                },
                body: JSON.stringify({ action: "clear" }),
              });
              const json = await res.json().catch(() => ({}));
              if (!res.ok) throw new Error(json?.error ?? "Clear failed.");
              setStatus("Shared log cleared + committed.");
              setRefresh((n) => n + 1);
            } catch (e) {
              setStatus(e instanceof Error ? e.message : "Clear failed.");
            }
          }}
          className="border border-blood px-4 py-2 font-sans text-[11px] uppercase tracking-[0.18em] text-blood"
        >
          Clear shared log
        </button>
      </div>
      {status ? (
        <p className="mt-3 font-sans text-sm text-ink/70">{status}</p>
      ) : null}
      <h3 className="mt-8 font-display text-2xl uppercase">
        Shared log ({sharedLog.length})
      </h3>
      <OrderList log={sharedLog} empty="No shared orders yet." />
      <h3 className="mt-8 font-display text-2xl uppercase">
        This browser ({localLog.length})
      </h3>
      <OrderList log={localLog} empty="No WhatsApp checkouts recorded in this browser yet." />
    </div>
  );
}

function OrderList({ log, empty }: { log: OrderLogEntry[]; empty: string }) {
  if (log.length === 0) {
    return <p className="mt-4 font-sans text-sm text-ink/60">{empty}</p>;
  }
  return (
    <ul className="mt-4 divide-y divide-ink border-y border-ink">
      {log.map((o, i) => (
        <li key={`${o.at}-${i}`} className="py-4">
          <p className="font-sans text-[11px] uppercase tracking-[0.16em] text-ink/60">
            {new Date(o.at).toLocaleString()}
            {o.coupon ? ` · ${o.coupon} −${formatINR(o.discount)}` : ""}
          </p>
          <ul className="mt-2 font-sans text-sm">
            {o.lines.map((l, j) => (
              <li key={j}>
                {l.sku}
                {l.size ? ` (${l.size})` : ""} × {l.qty} — {l.name} —{" "}
                {formatINR(l.unitPrice * l.qty)}
              </li>
            ))}
          </ul>
          <p className="mt-2 font-sans text-sm font-medium">
            {formatINR(o.subtotal)}
            {o.discount > 0 ? ` − ${formatINR(o.discount)}` : ""} ={" "}
            {formatINR(o.total)}
          </p>
        </li>
      ))}
    </ul>
  );
}

function SettingsTab() {
  const { settings, loaded, save } = useSiteSettings();
  const [phone, setPhone] = useState(settings.whatsappPhone);
  const [email, setEmail] = useState(settings.contactEmail);
  const [instagram, setInstagram] = useState(settings.instagramUrl);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    if (loaded && !synced) {
      setPhone(settings.whatsappPhone);
      setEmail(settings.contactEmail);
      setInstagram(settings.instagramUrl);
      setSynced(true);
    }
  }, [loaded, synced, settings]);

  async function onSave() {
    setSaving(true);
    setError("");
    setStatus("Saving…");
    try {
      const result = await save(
        {
          whatsappPhone: phone.replace(/\D/g, ""),
          contactEmail: email.trim(),
          instagramUrl: instagram.trim() || "https://instagram.com",
        },
        getStoredPin(),
      );
      setStatus(
        result?.committed
          ? "Saved + committed. Live everywhere after redeploy (~1–2 min)."
          : "Saved.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
      setStatus("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2 className="font-display text-3xl uppercase">Settings</h2>
      <p className="mt-2 max-w-2xl font-sans text-sm text-ink/70">
        WhatsApp number, contact email and Instagram link. Saving commits{" "}
        <code>settings.json</code> to GitHub — footer, contact page and
        checkout message update after redeploy.
      </p>
      <div className="mt-6 grid max-w-2xl gap-4">
        <label className="flex flex-col gap-1 font-sans text-xs uppercase tracking-[0.12em]">
          WhatsApp number (digits only, with country code)
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="918618425359"
            className="border border-ink bg-bone px-3 py-2 font-sans text-sm normal-case tracking-normal"
          />
        </label>
        <label className="flex flex-col gap-1 font-sans text-xs uppercase tracking-[0.12em]">
          Contact email
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="kshamithrajshetty@gmail.com"
            className="border border-ink bg-bone px-3 py-2 font-sans text-sm normal-case tracking-normal"
          />
        </label>
        <label className="flex flex-col gap-1 font-sans text-xs uppercase tracking-[0.12em]">
          Instagram URL
          <input
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            placeholder="https://instagram.com/…"
            className="border border-ink bg-bone px-3 py-2 font-sans text-sm normal-case tracking-normal"
          />
        </label>
      </div>
      {error ? <p className="mt-3 font-sans text-sm text-blood">{error}</p> : null}
      {status ? (
        <p className="mt-3 border border-ink p-3 font-sans text-sm">{status}</p>
      ) : null}
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="mt-4 bg-blood px-5 py-2 font-sans text-[11px] uppercase tracking-[0.18em] text-bone disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save settings"}
      </button>
    </div>
  );
}
