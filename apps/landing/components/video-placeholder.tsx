import { IconPlay } from "@/components/ui/icons";

export function VideoPlaceholder() {
  return (
    <section className="flex w-full max-w-md flex-col items-center px-6 pt-16 pb-32 sm:max-w-lg md:max-w-2xl md:px-12 lg:max-w-3xl xl:max-w-5xl lg:px-16 min-[1624px]:max-w-6xl min-[1900px]:max-w-7xl">
      <div className="relative flex aspect-video w-full max-w-3xl cursor-pointer items-center justify-center rounded-xl border border-border bg-surface/50">
        <IconPlay size={24} className="text-foreground" />
        <span className="absolute bottom-1/3 text-sm text-muted">
          (coming soon)
        </span>
      </div>
    </section>
  );
}
