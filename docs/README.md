# NARCI

Brutalist marketing + catalog site for NARCI — statement wall pieces (framed weapons, motorsport mounts, katana art). Cart is client-only; checkout is a WhatsApp handoff. No backend.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Swap in real photography

1. Drop JPGs at the paths in [`data/products.ts`](data/products.ts) (under `public/products/`).
2. Set `USE_REAL_PHOTOS` to `true` in [`components/ProductVisual.tsx`](components/ProductVisual.tsx).

## WhatsApp

Replace the placeholder in [`lib/whatsapp.ts`](lib/whatsapp.ts):

```ts
// TODO: replace with real WhatsApp Business number
export const WHATSAPP_PHONE = "15555555555";
```

## Deploy

Vercel: import the repo and deploy. No env vars required for the current build.
