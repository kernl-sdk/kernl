"use client";

const logos = [
  { src: "/logos/anthropic.svg", alt: "Anthropic", height: 20 },
  { src: "/logos/openai-white.svg", alt: "OpenAI", height: 60 },
  { src: "/logos/turbopuffer.svg", alt: "Turbopuffer", height: 30 },
];

export function LogoMarquee() {
  return (
    <section className="relative mt-12 w-full max-w-4xl overflow-hidden py-12 [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
      <div className="flex animate-marquee items-center gap-16">
        {[...logos, ...logos, ...logos, ...logos].map((logo, i) => (
          <img
            key={i}
            src={logo.src}
            alt={logo.alt}
            style={{ height: logo.height, width: "auto" }}
          />
        ))}
      </div>
    </section>
  );
}
