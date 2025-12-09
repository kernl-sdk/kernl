const features = [
  {
    title: "Memory-first",
    description:
      "Memory isn't an afterthought. Your agents remember what matters.",
  },
  {
    title: "Provider agnostic",
    description:
      "No lock-in. Swap Claude for GPT mid-conversation. Your code stays the same.",
  },
  {
    title: "Production-ready",
    description:
      "Thread persistence, streaming, type safety. Everything to ship, nothing extra.",
  },
];

export function Features() {
  return (
    <section className="flex w-full max-w-md flex-col gap-24 py-32 sm:max-w-lg md:max-w-2xl lg:max-w-3xl xl:max-w-5xl min-[1624px]:max-w-6xl min-[1900px]:max-w-7xl">
      <h2 className="text-2xl font-semibold text-foreground">
        Building agents doesn't have to be hard.
      </h2>

      <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-0">
        {features.map((feature, index) => (
          <div
            key={feature.title}
            className="flex flex-col gap-3 border-l border-border pl-6"
          >
            <span className="font-mono text-xs text-brand">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-2 text-2xl font-medium text-foreground">
              {feature.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {feature.description}
            </p>
          </div>
        ))}
      </div>

      <h2 className="self-end text-2xl font-semibold text-foreground">
        Less boilerplate. More building.
      </h2>
    </section>
  );
}
