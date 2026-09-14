"use client";

import { FormEvent, useState } from "react";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    // Real handler would POST to an API route / form service here.
    console.log("[NARCI contact]", { name, email, message });
    const subject = encodeURIComponent(`NARCI enquiry from ${name}`);
    const body = encodeURIComponent(`${message}\n\n— ${name}\n${email}`);
    window.location.href = `mailto:kshamithrajshetty@gmail.com?subject=${subject}&body=${body}`;
    setSent(true);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-0 border border-ink">
      <input
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="NAME"
        className="border-b border-ink bg-transparent px-4 py-3 font-sans text-sm uppercase tracking-wider outline-none"
      />
      <input
        required
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="EMAIL"
        className="border-b border-ink bg-transparent px-4 py-3 font-sans text-sm uppercase tracking-wider outline-none"
      />
      <textarea
        required
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="MESSAGE"
        rows={6}
        className="border-b border-ink bg-transparent px-4 py-3 font-sans text-sm outline-none"
      />
      <button
        type="submit"
        className="bg-blood py-4 font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-bone"
      >
        {sent ? "Opening mail" : "Send"}
      </button>
    </form>
  );
}
