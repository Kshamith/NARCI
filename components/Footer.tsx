"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { WHATSAPP_PHONE } from "@/lib/whatsapp";

export function Footer() {
  const [email, setEmail] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    // Placeholder: wire to an email provider later.
    console.log("[NARCI newsletter]", email);
    setEmail("");
  }

  return (
    <footer className="border-t border-bone/20 bg-ink text-bone">
      <div className="grid gap-10 px-4 py-12 md:grid-cols-3 md:px-6 md:py-16">
        <div>
          <p className="font-display text-2xl tracking-tight">NARCI</p>
          <p className="mt-3 max-w-xs font-sans text-xs uppercase tracking-[0.16em] text-bone/70">
            Statement pieces. Not home goods.
          </p>
        </div>
        <div className="flex flex-col gap-2 font-sans text-[11px] uppercase tracking-[0.18em]">
          <Link href="/shop" className="hover:text-blood">
            Shop
          </Link>
          <Link href="/about" className="hover:text-blood">
            About
          </Link>
          <Link href="/contact" className="hover:text-blood">
            Contact
          </Link>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-blood"
          >
            Instagram
          </a>
          <a
            href={`https://wa.me/${WHATSAPP_PHONE}`}
            target="_blank"
            rel="noreferrer"
            className="hover:text-blood"
          >
            WhatsApp
          </a>
        </div>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <label className="font-sans text-[11px] uppercase tracking-[0.18em]">
            Newsletter
          </label>
          <div className="flex border border-bone">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="EMAIL"
              className="min-w-0 flex-1 bg-transparent px-3 py-2 font-sans text-xs uppercase tracking-wider text-bone placeholder:text-bone/40 outline-none"
            />
            <button
              type="submit"
              className="border-l border-bone px-4 font-sans text-[11px] uppercase tracking-[0.16em]"
            >
              Join
            </button>
          </div>
        </form>
      </div>
    </footer>
  );
}
