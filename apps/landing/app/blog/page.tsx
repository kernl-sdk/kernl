"use client";

import { useState } from "react";
import { Header } from "@/components/header";
import { BlogCard } from "@/components/blog-card";
import { BlogHeader } from "@/components/blog-header";
import { MDXContent } from "@/components/mdx-content";
import { posts } from "#site/content";

export default function BlogPage() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const sortedPosts = posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const filteredPosts = sortedPosts
    .filter((post) => {
      // Changelog posts only show when changelog filter is active
      if (filter === "all") return post.category !== "changelog";
      return post.category === filter;
    })
    .filter((post) =>
      search === "" || post.title.toLowerCase().includes(search.toLowerCase())
    );

  const isChangelog = filter === "changelog";

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-5xl px-6 pt-32 pb-20">
        <BlogHeader
          onFilterChange={setFilter}
          activeFilter={filter}
          searchQuery={search}
          onSearchChange={setSearch}
        />

        {isChangelog ? (
          /* Timeline view for changelog */
          <div className="relative mt-12">
            <div className="space-y-12 md:space-y-0">
              {filteredPosts.map((log, index) => {
                const formattedDate = new Date(log.date).toLocaleDateString(
                  "en-US",
                  { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }
                );
                const isLatest = index === 0;
                const isLast = index === filteredPosts.length - 1;

                return (
                  <article
                    key={log.slug}
                    id={log.slug}
                    className="relative flex flex-col gap-4 pb-12 md:grid md:grid-cols-[200px_1fr] md:gap-12 md:pb-16"
                  >
                    {/* Timeline line - desktop only */}
                    {!isLast && (
                      <div className="hidden md:block absolute left-[7px] top-[15px] bottom-0 w-px bg-white/10" />
                    )}

                    {/* Date - simple on mobile, with dot on desktop */}
                    <div className="md:sticky md:top-32 md:self-start md:h-fit">
                      <div className="flex items-center gap-4">
                        <div className={`hidden md:block relative z-10 h-[15px] w-[15px] rounded-full border-4 border-[#0a0a0a] ${isLatest ? 'bg-steel' : 'bg-muted-foreground'}`} />
                        <time dateTime={log.date} className="text-sm text-muted-foreground md:text-foreground">
                          {formattedDate}
                        </time>
                      </div>
                    </div>

                    {/* Content column */}
                    <div className="min-w-0">
                      <h2 className="text-xl md:text-[1.375rem] font-semibold text-foreground mb-4 md:mb-6 tracking-[-0.012em] leading-[1.6]">
                        {log.title}
                      </h2>
                      <div className="prose-custom">
                        <MDXContent code={log.body} />
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        ) : (
          /* Card grid for other categories */
          <div className="mt-12 grid gap-x-10 gap-y-16 md:grid-cols-2">
            {filteredPosts.map((post, index) => (
              <div key={post.slug} className={`relative ${index % 2 === 0 ? 'md:pr-6' : 'md:pl-6'}`}>
                {index % 2 === 1 && (
                  <div className="absolute -left-5 top-0 bottom-0 w-px bg-white/5 hidden md:block" />
                )}
                <BlogCard
                  slug={post.slug}
                  title={post.title}
                  excerpt={post.excerpt}
                  date={post.date}
                  author={post.author}
                  category={post.category}
                  image={post.image}
                />
              </div>
            ))}
          </div>
        )}

        {filteredPosts.length === 0 && (
          <p className="mt-12 text-center text-muted-foreground">
            No posts found.
          </p>
        )}
      </main>
    </div>
  );
}
