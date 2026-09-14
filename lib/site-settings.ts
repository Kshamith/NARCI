"use client";

import { useCallback, useEffect, useState } from "react";

export type SiteSettings = {
  whatsappPhone: string;
  contactEmail: string;
  instagramUrl: string;
};

export const DEFAULT_SETTINGS: SiteSettings = {
  whatsappPhone: "918618425359",
  contactEmail: "kshamithrajshetty@gmail.com",
  instagramUrl: "https://instagram.com",
};

function sanitizeSettings(v: unknown): SiteSettings | null {
  if (typeof v !== "object" || v === null) return null;
  const r = v as Record<string, unknown>;
  const phone = String(r.whatsappPhone ?? "").replace(/\D/g, "");
  const email = String(r.contactEmail ?? "").trim();
  const insta = String(r.instagramUrl ?? "").trim();
  if (!phone || !email) return null;
  return {
    whatsappPhone: phone,
    contactEmail: email,
    instagramUrl: insta || DEFAULT_SETTINGS.instagramUrl,
  };
}

/** Site settings (WhatsApp / email / Instagram). Reads shared JSON, falls back to defaults. */
export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/data/settings.json", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (cancelled) return;
        const s = sanitizeSettings(j);
        if (s) setSettings(s);
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const save = useCallback(async (next: SiteSettings, pin: string) => {
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-admin-pin": pin },
      body: JSON.stringify(next),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.error ?? `Save failed (${res.status})`);
    const s = sanitizeSettings(json?.settings ?? next) ?? next;
    setSettings(s);
    return json as { ok: true; committed?: boolean; sha?: string; url?: string };
  }, []);

  return { settings, loaded, save, setSettings };
}

export { sanitizeSettings };
