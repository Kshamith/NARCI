import type { Metadata } from "next";
import fs from "node:fs/promises";
import path from "node:path";
import { ContactForm } from "@/components/ContactForm";
import { WHATSAPP_PHONE } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Contact",
};

async function getContactSettings() {
  try {
    const raw = await fs.readFile(
      path.join(process.cwd(), "public", "data", "settings.json"),
      "utf8",
    );
    const j = JSON.parse(raw) as {
      whatsappPhone?: unknown;
      contactEmail?: unknown;
      instagramUrl?: unknown;
    };
    return {
      phone:
        typeof j.whatsappPhone === "string" && j.whatsappPhone
          ? j.whatsappPhone
          : WHATSAPP_PHONE,
      email:
        typeof j.contactEmail === "string" && j.contactEmail
          ? j.contactEmail
          : "kshamithrajshetty@gmail.com",
      instagram:
        typeof j.instagramUrl === "string" && j.instagramUrl
          ? j.instagramUrl
          : "https://instagram.com",
    };
  } catch {
    return {
      phone: WHATSAPP_PHONE,
      email: "kshamithrajshetty@gmail.com",
      instagram: "https://instagram.com",
    };
  }
}

export default async function ContactPage() {
  const { phone, email, instagram } = await getContactSettings();
  return (
    <div className="grid border-b border-ink lg:grid-cols-2">
      <div className="border-b border-ink px-4 py-12 md:px-6 md:py-16 lg:border-b-0 lg:border-r">
        <p className="font-sans text-[11px] uppercase tracking-[0.22em]">
          Direct line
        </p>
        <h1 className="mt-4 font-display text-6xl uppercase leading-[0.85] tracking-tight md:text-8xl">
          Talk
          <br />
          to us.
        </h1>
        <p className="mt-8 max-w-md font-sans text-sm leading-relaxed">
          Custom sizes, wholesale, press, or you just want the F1 wing in a
          different finish. No ticket system. WhatsApp is faster.
        </p>
        <div className="mt-10 flex flex-col gap-3 font-sans text-[11px] uppercase tracking-[0.18em]">
          <a
            href={`https://wa.me/${phone}`}
            target="_blank"
            rel="noreferrer"
            className="border border-ink px-4 py-3 hover:bg-ink hover:text-bone"
          >
            WhatsApp
          </a>
          <a
            href={instagram}
            target="_blank"
            rel="noreferrer"
            className="border border-ink px-4 py-3 hover:bg-ink hover:text-bone"
          >
            Instagram
          </a>
          <a
            href={`mailto:${email}`}
            className="border border-ink px-4 py-3 hover:bg-ink hover:text-bone"
          >
            {email}
          </a>
        </div>
      </div>
      <div className="px-4 py-12 md:px-6 md:py-16">
        <ContactForm />
      </div>
    </div>
  );
}
