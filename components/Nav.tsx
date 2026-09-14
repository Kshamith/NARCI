"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/cart/useCart";

const links = [
  { href: "/", label: "HOME", match: (p: string) => p === "/" },
  { href: "/shop", label: "SHOP", match: (p: string) => p === "/shop" || p.startsWith("/shop/") },
  { href: "/about", label: "ABOUT", match: (p: string) => p === "/about" },
  { href: "/contact", label: "CONTACT", match: (p: string) => p === "/contact" },
];

export function Nav() {
  const { count, setOpen } = useCart();
  const pathname = usePathname() ?? "/";

  return (
    <header className="sticky top-0 z-40 border-b border-ink bg-bone">
      <div className="grid h-12 grid-cols-[1fr_auto_1fr] items-center px-4 md:h-14 md:grid-cols-3 md:px-6">
        <Link
          href="/"
          className="font-display text-lg tracking-tight md:text-xl"
        >
          NARCI
        </Link>
        <nav className="flex justify-center gap-4 font-sans text-[10px] font-medium uppercase tracking-[0.16em] md:gap-6 md:text-[11px] md:tracking-[0.2em]">
          {links.map((l) => {
            const active = l.match(pathname);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "text-blood underline underline-offset-4"
                    : "hover:text-blood"
                }
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="justify-self-end font-sans text-[11px] font-medium uppercase tracking-[0.18em]"
        >
          BAG{count > 0 ? ` ${count}` : ""}
        </button>
      </div>
    </header>
  );
}
