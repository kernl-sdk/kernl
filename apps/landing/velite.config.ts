import rehypePrettyCode from "rehype-pretty-code";
import remarkGfm from "remark-gfm";
import { defineCollection, defineConfig, s } from "velite";
import jotai from "./themes/jotai.json";

const posts = defineCollection({
  name: "Post",
  pattern: "blog/**/*.mdx",
  schema: s
    .object({
      title: s.string().max(99),
      slug: s.slug("posts"),
      date: s.isodate(),
      author: s.string(),
      category: s.enum([
        "engineering",
        "changelog",
        "product",
        "community",
        "guides",
      ]),
      excerpt: s.string().max(200),
      image: s.string().optional(),
      body: s.mdx(),
    })
    .transform((data) => ({
      ...data,
      permalink: `/blog/${data.slug}`,
    })),
});

export default defineConfig({
  root: "content",
  output: {
    data: ".velite",
    assets: "public/static",
    base: "/static/",
    name: "[name]-[hash:6].[ext]",
    clean: true,
  },
  collections: { posts },
  mdx: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      [
        rehypePrettyCode,
        {
          theme: jotai as any,
          keepBackground: false,
        },
      ],
    ],
  },
});
