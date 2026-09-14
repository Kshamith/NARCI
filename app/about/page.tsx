import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <article className="border-b border-ink">
      <header className="border-b border-ink px-4 py-16 md:px-6 md:py-24">
        <p className="font-sans text-[11px] uppercase tracking-[0.22em]">
          Manifesto
        </p>
        <h1 className="mt-6 font-display text-[14vw] uppercase leading-[0.8] tracking-tight">
          We do
          <br />
          not
          <br />
          decorate.
        </h1>
      </header>
      <div className="grid border-b border-ink md:grid-cols-2">
        <p className="min-w-0 border-b border-ink px-4 py-10 font-display text-4xl uppercase leading-[0.9] md:border-b-0 md:border-r md:px-6 md:text-5xl lg:text-6xl">
          Rebellious.
          <br />
          Aesthetic.
          <br />
          Unbreakable.
        </p>
        <div className="min-w-0 space-y-6 px-4 py-10 font-sans text-base leading-relaxed md:px-6 md:text-lg">
          <p>
            NARCI makes wall pieces that look like they should not be allowed
            in an apartment. Framed guns on money print. F1 wings as sculpture.
            Katanas locked in black steel. If your room already has a throw
            pillow that says “live laugh love,” this is not for you.
          </p>
          <p>
            Built for Gen Z and internet-native buyers who treat the wall like
            a feed: one brutal image, shot tight, no apology. Motivational
            without the quote. Masculine without the gym-bro font pack.
          </p>
          <p>
            No soft goods. No beige still lifes. Power, or nothing.
          </p>
        </div>
      </div>
      <div className="grid md:grid-cols-3">
        {[
          ["Bold", "Type large enough to start a fight."],
          ["Brutalism", "Hairline borders. Zero radius. No shadows."],
          ["Power", "Objects that look expensive and slightly illegal."],
        ].map(([word, copy]) => (
          <div
            key={word}
            className="border-b border-ink px-4 py-10 md:border-r md:last:border-r-0 md:px-6"
          >
            <h2 className="font-display text-3xl uppercase">{word}</h2>
            <p className="mt-3 font-sans text-sm">{copy}</p>
          </div>
        ))}
      </div>
    </article>
  );
}
