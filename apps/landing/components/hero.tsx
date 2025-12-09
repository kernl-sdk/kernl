import { IconKernl } from "@/components/ui/icons";
import { InstallCommand } from "@/components/install-command";

export function Hero() {
  return (
    <section className="flex flex-col items-center justify-center gap-6 pt-32 pb-16">
      <IconKernl size={36} className="mb-2 text-steel animate-blur-rise" />
      <h1 className="font-mono text-3xl font-light text-brand-neon animate-blur-rise animate-delay-100">kernl</h1>
      <p className="mt-2 text-lg font-medium text-foreground animate-blur-rise animate-delay-200">
        The runtime for software 3.0
      </p>
      <div className="animate-blur-rise animate-delay-300">
        <InstallCommand />
      </div>
    </section>
  );
}
