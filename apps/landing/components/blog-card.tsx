import Link from "next/link";

interface BlogCardProps {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  category: string;
  image?: string;
}

function ArrowIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

export function BlogCard({
  slug,
  title,
  excerpt,
  date,
  author,
  category,
  image,
}: BlogCardProps) {
  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <Link href={`/blog/${slug}`} className="group block">
      <article className="flex flex-col gap-3">
        {/* Image placeholder */}
        <div className="aspect-[16/9] w-full overflow-hidden rounded-lg bg-[oklch(0.12_0_0)] border border-white/5">
          {image ? (
            <img src={image} alt={title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground/30 font-mono text-xs">
              {category}
            </div>
          )}
        </div>

        {/* Meta */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
          <span>{author}</span>
          <span>·</span>
          <time dateTime={date}>{formattedDate}</time>
        </div>

        {/* Title with arrow */}
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-xl font-semibold text-foreground leading-snug">
            {title}
          </h2>
          <span className="mt-0.5 text-muted-foreground opacity-0 -translate-x-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0">
            <ArrowIcon />
          </span>
        </div>

        {/* Excerpt */}
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
          {excerpt}
        </p>
      </article>
    </Link>
  );
}
