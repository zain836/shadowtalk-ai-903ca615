const LINES = [
  "17 years old. Building what teams of fifty haven't shipped.",
  "Sovereign AI — not rented intelligence from someone else's cloud.",
  "Karachi to the world. Pakistan deserves its own AI stack.",
  "Bootstrapped with grit. Proof of work over proof of degree.",
  "ShadowTalk isn't a chatbot. It's infrastructure for builders.",
  "While others prompt, Zain architects.",
  "Intelligence without internet. Freedom without permission.",
  "The next billion users won't wait for Silicon Valley.",
];

const AboutQuoteMarquee = () => {
  const doubled = [...LINES, ...LINES];

  return (
    <section className="py-6 border-y border-border/40 bg-muted/20 overflow-hidden about-marquee-section">
      <div className="about-marquee-track flex gap-10 whitespace-nowrap">
        {doubled.map((line, i) => (
          <span
            key={`${i}-${line.slice(0, 12)}`}
            className="inline-flex items-center gap-10 text-sm md:text-base font-medium text-muted-foreground/90 shrink-0"
          >
            <span className="about-marquee-highlight">{line}</span>
            <span className="text-primary/40" aria-hidden>
              ✦
            </span>
          </span>
        ))}
      </div>
    </section>
  );
};

export default AboutQuoteMarquee;
