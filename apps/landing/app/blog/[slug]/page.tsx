import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { Header } from "@/components/header";
import { posts } from "#site/content";
import { MDXContent } from "@/components/mdx-content";

interface Props {
  params: Promise<{ slug: string }>;
}

function getPost(slug: string) {
  return posts.find((post) => post.slug === slug);
}

export async function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};

  return {
    title: `${post.title} | kernl`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);

  if (!post) {
    notFound();
  }

  const formattedDate = new Date(post.date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-3xl px-6 pt-32 pb-20">
        {/* Back link */}
        <Link
          href="/blog"
          className="inline-flex text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ←
        </Link>

        {/* Header */}
        <header className="mt-8">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="capitalize">{post.category}</span>
            <span>·</span>
            <time dateTime={post.date}>{formattedDate}</time>
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-foreground leading-tight md:text-3xl">
            {post.title}
          </h1>
          <span className="mt-2 inline-block font-mono text-xs text-brand">
            {post.author}
          </span>
        </header>

        {/* Content */}
        <article className="prose-custom mt-12">
          <MDXContent code={post.body} />
        </article>
      </main>
    </div>
  );
}
