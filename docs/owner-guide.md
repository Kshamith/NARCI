# NARCI Website — Owner's Codebase Guide

> Technical guide for the site owner. Assumes basic comfort opening files and
> running commands. All paths are relative to the repo root (`narci-web/`).
> A styled, printable version of this same guide lives at
> [`docs/owner-guide.html`](./owner-guide.html).

## Contents

- [0. Placeholders you must replace before launch](#0-placeholders-you-must-replace-before-launch)
- [1. What this site is](#1-what-this-site-is)
- [2. Viewing and editing the site](#2-viewing-and-editing-the-site)
- [3. Pages and URLs](#3-pages-and-urls)
- [4. Top bar and footer](#4-top-bar-and-footer)
- [5. Products: the catalog](#5-products-the-catalog)
- [6. Product photos](#6-product-photos)
- [7. Home page hero](#7-home-page-hero)
- [8. Shop page: cards, filter, sorting](#8-shop-page-cards-filter-sorting)
- [9. Product detail page](#9-product-detail-page)
- [10. Bag, coupons and WhatsApp checkout](#10-bag-coupons-and-whatsapp-checkout)
- [11. Admin console (`/admin`)](#11-admin-console-admin)
- [12. Look and feel: colors, fonts, global CSS](#12-look-and-feel-colors-fonts-global-css)
- [13. Safe to touch vs ask a developer](#13-safe-to-touch-vs-ask-a-developer)
- [14. Troubleshooting](#14-troubleshooting)
- [Glossary](#glossary)

---

## 0. Placeholders you must replace before launch

| # | What | File | Current value | Replace with |
|---|------|------|---------------|--------------|
| 1 | WhatsApp number orders go to | `lib/whatsapp.ts:5` | `"15555555555"` | Real WhatsApp Business number in country-code format, digits only (e.g. `"919876543210"`) |
| 2 | Instagram link | `components/Footer.tsx:37`, `app/contact/page.tsx:35` | `https://instagram.com` | Brand profile URL, e.g. `https://instagram.com/narci.studio` |
| 3 | Contact email | `app/contact/page.tsx:43-46`, `components/ContactForm.tsx:17` | `studio@narci.example` | Real inbox, in both files |
| 4 | Newsletter signup | `components/Footer.tsx:13` | `console.log` only — submissions go nowhere | Wire to an email provider (e.g. Buttondown, Mailchimp) or remove the form |
| 5 | Product photos | `public/products/` + `components/ProductVisual.tsx:9` | Branded placeholder blocks | Real JPGs; then set `USE_REAL_PHOTOS = true` (see §6) |
| 6 | Admin PIN | `components/AdminConsole.tsx:16-19` | Demo PIN `narci123` | Set env var `NEXT_PUBLIC_ADMIN_PIN` (see §11) |

---

## 1. What this site is

- **Stack:** Next.js 14 + React 18 + Tailwind CSS 3.4 (see `package.json:5-27`). Static export-friendly; deployed on Vercel with no required env vars.
- **No backend, no database.** The catalog is a TypeScript list (`data/products.ts`). The bag lives in each visitor's browser (`localStorage`). Checkout opens WhatsApp with a pre-filled order message. Admin edits also live in browser `localStorage` (see §11 for the implications).
- **Where things live:**

| Directory | Contains | Edit when you want to change… |
|-----------|----------|-------------------------------|
| `data/` | Product list + price/size helpers | Products, prices, sizes, categories |
| `components/` | Reusable UI (nav, cards, cart, admin) | How things look and behave |
| `app/` | Pages and URLs (one folder = one URL) | Page copy, which page exists at which URL |
| `lib/` | Business logic (coupons, WhatsApp message, formatting, storage) | Discount rules, order message, currency format |
| `public/products/` | Product JPGs | Photos |
| `app/globals.css`, `tailwind.config.ts` | Colors, fonts, global rules | Brand styling |

---

## 2. Viewing and editing the site

```bash
npm install   # once
npm run dev   # local preview at http://localhost:3000
npm run lint  # static checks
npm run build # production build (run before deploying)
```

Workflow: edit a file → save → the dev server hot-reloads → check `http://localhost:3000`. The `package.json:5-10` scripts are the only commands you need.

---

## 3. Pages and URLs

In Next.js App Router, **a folder inside `app/` is a URL**. `app/shop/page.tsx` is `/shop`; `app/shop/[slug]/page.tsx` is every `/shop/<product-url>`.

| URL | File | Renders with |
|-----|------|--------------|
| `/` | `app/page.tsx` | `components/HomeHero.tsx` |
| `/shop` | `app/shop/page.tsx` | `components/ShopCatalog.tsx` + `components/ShopCard.tsx` |
| `/shop/<slug>` | `app/shop/[slug]/page.tsx` | `components/ProductDetail.tsx` (admin-added products resolve via `components/AdminProductPage.tsx`) |
| `/about` | `app/about/page.tsx` | Self-contained manifesto page |
| `/contact` | `app/contact/page.tsx` | `components/ContactForm.tsx` |
| `/admin` | `app/admin/page.tsx` | `components/AdminConsole.tsx` (PIN-gated, `noindex`) |
| 404 | `app/not-found.tsx` | Shown for genuinely unknown URLs |

The shared shell (top bar, footer, bag drawer on every page) is composed in `app/layout.tsx:39-44`. Site title/description defaults live in `app/layout.tsx:20-27`; per-page titles are set via `metadata` exports (e.g. `app/about/page.tsx:3-5`).

---

## 4. Top bar and footer

### Top bar — `components/Nav.tsx`

Nav links are a data array (`Nav.tsx:7-12`):

```ts
const links = [
  { href: "/", label: "HOME", match: (p: string) => p === "/" },
  { href: "/shop", label: "SHOP", match: (p: string) => p === "/shop" || p.startsWith("/shop/") },
  { href: "/about", label: "ABOUT", match: (p: string) => p === "/about" },
  { href: "/contact", label: "CONTACT", match: (p: string) => p === "/contact" },
];
```

- **Add/rename a tab:** add or edit an entry. Keep `href`, `label` and `match` consistent — `match` decides the red underline for the active page (`Nav.tsx:28-44`).
- **Brand text** (top-left "NARCI"): `Nav.tsx:21-26`.
- **Bag button** (top-right, opens the cart drawer): `Nav.tsx:46-52`. The count badge comes from the cart context; don't hand-edit the number.

### Footer — `components/Footer.tsx`

- Tagline ("Statement pieces. Not home goods."): `Footer.tsx:22-24`.
- Link list (Shop / About / Contact / Instagram / WhatsApp): `Footer.tsx:27-51`. WhatsApp reuses `WHATSAPP_PHONE`, so fixing §0 item 1 fixes the footer too.
- Newsletter form (`Footer.tsx:53-73`) is a **placeholder**: submit only runs `console.log` (`Footer.tsx:13`) and clears the field. Either connect it to a provider or delete the `<form>` block.

---

## 5. Products: the catalog

`data/products.ts` is the source of truth for the 5 built-in products. Each product is an object with these fields:

| Field | Type | Used for | Rules |
|-------|------|----------|-------|
| `id` | string | Internal identity (also picks the dark placeholder variant for `"3"`/`"5"`) | Unique; never reuse |
| `sku` | string | Shown on cards, detail pages, bag lines and WhatsApp messages (e.g. `NARCI-001`) | Unique, permanent — treat as the product's ID |
| `slug` | string | URL: `/shop/<slug>` | Unique, lowercase, dashes only |
| `name` | string | Card title, detail heading | 1–2 lines; cards reserve exactly 2 lines |
| `tagline` | string | Card subtitle + detail subheading | Keep to one line |
| `description` | string | Detail page paragraph | Free text |
| `price` | number | Base price (INR, no decimals) | Fallback when `sizes` is absent |
| `sizes` | `{ label, price }[]` | Size variants, each with its **own** price | ≥1 entry; single-size products use `[{ label: "ONE SIZE", price }]` |
| `images` | string[3] | FRONT / SIDE / DETAIL views | Paths under `/products/…`; keep 3 per product |
| `category` | string | Shop filter dropdown value | Free text — keep spelling consistent or the filter splits |
| `specs` | string[3] | Card spec row + detail spec list | Material, Dimensions, Mount; cards show the first 3 |

Example (abridged from `data/products.ts:29-50`):

```ts
{
  id: "1",
  sku: "NARCI-001",
  slug: "framed-katana",
  name: "Framed Katana",
  tagline: "Steel. Shadow. Wall.",
  description: "A full-length katana suspended in a brutalist black frame. …",
  price: 4200,
  sizes: [{ label: "ONE SIZE", price: 4200 }],
  images: [
    "/products/narci-001-01.jpg",
    "/products/narci-001-02.jpg",
    "/products/narci-001-03.jpg",
  ],
  category: "katana",
  specs: [
    "Black steel frame, museum acrylic",
    "120 × 28 cm",
    "Hidden French-cleat mount",
  ],
},
```

Multi-size example — each size carries its own price:

```ts
sizes: [
  { label: "S", price: 2900 },
  { label: "M", price: 3400 },
  { label: "L", price: 3900 },
],
```

Helpers in the same file: `getSizes()` (falls back to `ONE SIZE` at base price, `:146-149`), `getSizePrice()` (`:152-158`), `getFromPrice()` — lowest size price, shown as `FROM ₹X` on cards (`:161-164`). `FEATURED_SKU = "NARCI-003"` (`:141`) selects the home-page hero product.

> **Prefer the Admin console (§11) over hand-editing this file** for day-to-day product work. Hand-edit only for the initial bulk setup.

---

## 6. Product photos

Until real photography exists, `components/ProductVisual.tsx` renders branded placeholder blocks (product name + `FRONT`/`SIDE`/`DETAIL` labels). To go live with photos:

1. Save JPGs at exactly the paths listed in each product's `images` (files live in `public/products/`; the URL path is `/products/<file>.jpg`).
2. Keep **3 images per product** — they map to the FRONT / SIDE / DETAIL views (`ProductVisual.tsx:11`).
3. Flip the switch (`ProductVisual.tsx:9`):

```ts
const USE_REAL_PHOTOS = false;
// becomes:
const USE_REAL_PHOTOS = true;
```

Photos render with `object-contain` (`ProductVisual.tsx:36`), so any aspect ratio works without cropping. Portrait orientation suits the hero and card `aspect-[4/3]` / `aspect-[5/6]` frames best.

---

## 7. Home page hero

`components/HomeHero.tsx`:

- Featured product = `FEATURED_SKU` if present, else the first catalog item (`HomeHero.tsx:16-17`). Change the hero piece by changing `FEATURED_SKU` in `data/products.ts:141` (or by editing/deleting products in `/admin`).
- Giant background `NARCI` text (`HomeHero.tsx:30-38`), featured product visual, then an info strip (SKU + name + tagline, size(s), price — `FROM ₹X` when multi-size).
- "More steel" teaser row shows the next 4 products (`.slice(0, 4)`, `HomeHero.tsx:19`) linking to the full catalog; the manifesto block below is plain copy — edit the words in place.
- The hero's Add to Bag button adds the default (first) size.

---

## 8. Shop page: cards, filter, sorting

`components/ShopCatalog.tsx` renders the filter/sort header (title "Select a Model Series", Category + Sort dropdowns, `:32-67`) and a 2-column grid of `ShopCard`s (`:68-72`).

- **Categories** come from the data itself (`:13-16` — unique `category` values across products). Rename a category by editing the products; the dropdown updates automatically. Slashes/dashes display with spaces (`:49`).
- **Sorting** (`:18-28`): Featured (catalog order), Price ↑/↓ on the from-price.
- **Card uniformity** (`components/ShopCard.tsx`): title clamps to 2 lines with 2 lines always reserved, tagline and spec cells clamp with fixed heights, and the price/size/View footer is pinned to the card bottom — so 1-line and 2-line titles align across rows. This holds for admin-added products automatically.
- Card price shows `FROM ₹X` for multi-size products, plus a size-list row; single-size cards show a matching `ONE SIZE` row so all cards share identical structure.

---

## 9. Product detail page

`components/ProductDetail.tsx`, served by `app/shop/[slug]/page.tsx`:

- **Back bar** — `← Back to Shop` link + `Shop / <name>` breadcrumb at the top.
- **Gallery** — main visual plus 3 thumbnails switching FRONT/SIDE/DETAIL; active thumbnail inverts.
- **Size selector** — appears only when a product has 2+ sizes; buttons show `label · price`, selected state inverts. Single-size products show one static `ONE SIZE · ₹X` line. Displayed price, bag line and WhatsApp message all use the selected size's price.
- **Qty stepper + Add to Bag**, spec list, price, then a Related row (3 items, from-prices).
- **Live merge:** the detail page overlays admin-console edits (stored in browser `localStorage`) onto the built-in snapshot and resets size/qty/gallery when you navigate between products — so size changes made in `/admin` are selectable immediately.
- **Admin-added products:** their slugs don't exist in the static build, so `app/shop/[slug]/page.tsx` sets `dynamicParams = true` and unknown slugs fall through to `components/AdminProductPage.tsx`, which resolves them from the merged catalog client-side (brief "Loading…" on hard refresh) and only 404s for truly unknown slugs.

---

## 10. Bag, coupons and WhatsApp checkout

### Bag

- Slide-over drawer on every page (`components/cart/CartDrawer.tsx`, mounted in `app/layout.tsx:43`). State lives in `components/cart/CartProvider.tsx`; lines are keyed by **SKU + size**, quantities step ±, Remove deletes the line.
- Persistence: `localStorage` key `narci-cart` (old `{sku, qty}` carts migrate cleanly). Coupon code persists under `narci-coupon`.
- Prices in the bag resolve through the merged catalog, so admin price/size edits apply to bag lines too.

### Coupons

Rules live in `lib/coupons.ts`:

- Two seed codes (`coupons.ts:17-20`): `NARCI10` = 10% off, no minimum; `FLAT500` = ₹500 off, minimum subtotal ₹2,000.
- Types: `percent` (1–90, enforced in the admin form) or `flat` (capped at the subtotal — never negative totals). Optional `minSubtotal`. Codes are case-insensitive, normalized to uppercase (`normalizeCode`, `:22-24`).
- Checkout behavior (`CartDrawer.tsx`): Apply **validates first** — a wrong code keeps the input visible with an error and is never stored as "applied". The `X applied` box renders only for a code that actually discounts. A stored code that goes stale (bag shrinks below its minimum, or the code is disabled/deleted in `/admin`) auto-clears.
- Manage codes day-to-day in `/admin` → Coupons tab. To change the built-in seeds in code, edit `DEFAULT_COUPONS`.

### WhatsApp handoff

`lib/whatsapp.ts` builds the order text (`buildOrderMessage`, `:15-38`) and opens `https://wa.me/<number>?text=…` (`:75`). Message format:

```text
Hi NARCI, I'd like to order:
- NARCI-004 (M) x2 — Pit Wall Number Plate — ₹6,800
Subtotal: ₹6,800
Coupon: NARCI10 (−₹680)
Total: ₹6,120
```

Size appears per line, coupon/discount/subtotal only when a valid coupon applied. **Set the number first** (`lib/whatsapp.ts:5`):

```ts
// TODO: replace with real WhatsApp Business number
export const WHATSAPP_PHONE = "15555555555";
// becomes, e.g.:
export const WHATSAPP_PHONE = "919876543210";
```

Digits only, with country code, no `+`/spaces. The footer and contact-page WhatsApp buttons reuse this constant.

### Contact form

`components/ContactForm.tsx` collects name/email/message and opens the visitor's mail app addressed to `studio@narci.example` (`ContactForm.tsx:15-18`). There is **no server delivery** — update the address in `ContactForm.tsx:17` and the matching `mailto:` link in `app/contact/page.tsx:42-47`.

### Currency

`lib/format.ts` formats with `en-IN` / INR / zero decimals (`formatINR`). To change currency or decimals, that one function covers the whole site.

---

## 11. Admin console (`/admin`)

`app/admin/page.tsx` renders `components/AdminConsole.tsx` (page is `noindex`). Three tabs: **products**, **coupons**, **orders**.

### Entry gate

PIN screen; unlocked state kept in `sessionStorage` (`narci-admin-auth`) so it lasts until the tab closes. Expected PIN (`AdminConsole.tsx:16-19`):

```ts
const EXPECTED_PIN =
  process.env.NEXT_PUBLIC_ADMIN_PIN && process.env.NEXT_PUBLIC_ADMIN_PIN.length > 0
    ? process.env.NEXT_PUBLIC_ADMIN_PIN
    : "narci123";
```

Set a real PIN via env var `NEXT_PUBLIC_ADMIN_PIN` (Vercel → Project Settings → Environment Variables → redeploy). Note: this is a **UI gate, not real security** — anyone who can read the code/bundle can find it. Fine for hiding the console from customers; not access control.

### Products tab

- List shows name, SKU, `/shop/<slug>`, sizes with prices; per-row View / Edit / Delete; `+ New product`; `Reset defaults` restores the built-in five.
- Form fields: Name\*, SKU\* (e.g. `NARCI-006`, **locked after creation** — to change a SKU, delete and recreate), URL slug (auto-generated from the name via `slugify`, `:23-30`; override only if you need a custom URL), Category (free text; new values appear in the shop filter), Tagline, Base price (INR)\*, Description, Images (one `/products/….jpg` path per line), Specs (one per line; first three show on cards).
- **Sizes editor** (`:374+`): one row per variant, each with its own label + price; `+ Add size`; `×` removes a row. Single-size product = one row labelled `ONE SIZE` at the base price. Validation: name, SKU and base price required; ≥1 labelled size, each price > 0; SKU/slug must be unique.
- Saving writes the whole catalog to browser `localStorage` (`persist()` → key `narci-admin-products-v1`, see `lib/catalog-store.ts:6`).

### Coupons tab

Add code + type (`% off` / `₹ flat off`) + value + optional minimum subtotal; Enable/Disable toggle; Delete; `Reset defaults` restores `NARCI10`/`FLAT500`. Stored under `narci-coupons-v1`.

### Orders tab

There are **no server-side orders** — completed sales arrive as WhatsApp chats to `WHATSAPP_PHONE`. The tab explains this and shows a local log (this browser only, last 50 entries, `lib/orders.ts:32-40`) of each Bag → WhatsApp handoff: timestamp, lines with sizes, coupon, subtotal, total. Refresh / Clear log buttons included.

### The localStorage caveat (important)

Admin edits live **only in the browser where they were made** (keys: `narci-admin-products-v1`, `narci-coupons-v1`, `narci-order-log-v1`; bag: `narci-cart`, `narci-coupon`). Consequences:

- Edits are invisible in other browsers, devices and incognito windows.
- Clearing site data wipes them (Reset buttons restore built-ins).
- The code is structured for a future CMS swap without touching shop/cart components (`lib/catalog-store.ts:7-12`).
- Until then: make admin edits in the browser you demo from, and treat `data/products.ts` + `lib/coupons.ts` as the canonical defaults everyone else sees.

---

## 12. Look and feel: colors, fonts, global CSS

Brand tokens are defined twice — keep them in sync:

```ts
// tailwind.config.ts:11-15 — enables classes like bg-bone, text-ink, bg-blood
colors: {
  bone: "#F2EFEA",
  ink: "#0A0A0A",
  blood: "#C81D25",
},
```

```css
/* app/globals.css:5-9 — CSS variables for non-Tailwind contexts */
:root {
  --bone: #f2efea;
  --ink: #0a0a0a;
  --blood: #c81d25;
}
```

To rebrand: replace the three hex values in **both** files. Bone = background, ink = text/borders, blood = accents (active tab, discounts, CTA buttons).

- **Fonts** (`app/layout.tsx:9-18`): display = Archivo Black (`font-display`), body = Inter (`font-sans`). Change via the `next/font/google` imports; class names stay the same.
- **Signature rules** (`app/globals.css`): zero border-radius everywhere (`:11-13`); blood-on-bone text selection (`:25-28`); arrow cursor on plain copy with I-beam only inside text inputs (`:37-74`); hard ink focus outline instead of soft rings (`:77-80`).
- **Motion:** `framer-motion` powers the hero entrance (`HomeHero.tsx:30-44`) and the bag drawer slide (`CartDrawer.tsx`). Timings are local `snap` constants.

---

## 13. Safe to touch vs ask a developer

**Safe (copy, colors, content, links):** all product fields and `FEATURED_SKU` (`data/products.ts`); hero/manifesto/about copy (`HomeHero.tsx`, `app/about/page.tsx`); contact copy/links (`app/contact/page.tsx`); nav labels/links (`Nav.tsx:7-12`); footer tagline/links (`Footer.tsx`); brand hexes + fonts; `WHATSAPP_PHONE`, contact email, Instagram URL; seed coupons (`lib/coupons.ts:17-20`); cursor/selection CSS.

**Ask a developer:** checkout math and message building (`lib/whatsapp.ts`, `CartProvider.tsx`); coupon validation rules; cart line keys (`sku + size`); `AdminProductPage` resolution logic; routing/`dynamicParams`/metadata; the localStorage→CMS migration; newsletter backend wiring; anything in `lib/catalog-store.ts` sanitizers.

---

## 14. Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Order goes to the wrong number / nothing happens | `WHATSAPP_PHONE` still placeholder | Set real digits-only number (§10) |
| New admin product 404s on another device | Admin edits are per-browser localStorage | Edit in the demo browser; long-term: add a backend (§11) |
| New size not selectable | Saved on a stale form, or size row had no label | Label every size row; detail resets selection when sizes change (§9) |
| Coupon "invalid" | Typo, disabled/deleted code, or bag below `minSubtotal` | Check `/admin` → Coupons; note minimums (§10) |
| Shop filter shows two near-identical categories | `category` spelling differs between products | Unify the string in `data/products.ts` or `/admin` |
| Card titles overlap / rows misalign | Custom CSS overriding clamps | Keep `line-clamp-*` + reserved heights in `ShopCard.tsx` |
| Old prices show after admin edits | Viewing in a different browser, or cached static page | Same browser; hard refresh; rebuild/redeploy |
| Admin PIN hint shows demo PIN publicly | `NEXT_PUBLIC_ADMIN_PIN` unset | Set the env var and redeploy (§11) |
| Newsletter "Join" does nothing visible | Placeholder handler | Wire a provider or remove the form (§4) |

---

## Glossary

- **Component** — a reusable UI building block (`components/`). Pages compose them.
- **Route** — a URL. Folder under `app/` = URL segment; `page.tsx` = what renders there; `[slug]` = a dynamic segment matching any product URL.
- **`localStorage`** — per-browser key-value storage on the visitor's device. Persists across reloads, but is invisible to other devices and to the server.
- **Static generation (SSG)** — pages pre-rendered at build time (`npm run build`). The 5 built-in products pre-render; admin-added ones resolve in the browser.
- **Noindex** — tells search engines not to list `/admin`.
- **Slug** — URL-safe product identifier (`framed-katana` → `/shop/framed-katana`).
- **SKU** — stock-keeping unit; the permanent product code shown to buyers and staff.
