import { defineConfig, defineDocs, frontmatterSchema, metaSchema } from 'fumadocs-mdx/config';
import { z } from 'zod';
import jotaiTheme from './themes/jotai.json';
import { remarkStripMdLinks } from './lib/remark-strip-md-links';

// Extend frontmatter - title optional for auto-generated API reference
const extendedSchema = frontmatterSchema.extend({
  title: z.string().optional(),
  image: z.string().optional(),
});

// You can customise Zod schemas for frontmatter and `meta.json` here
// see https://fumadocs.dev/docs/mdx/collections
export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: extendedSchema,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

export default defineConfig({
  mdxOptions: {
    remarkPlugins: [remarkStripMdLinks],
    rehypeCodeOptions: {
      themes: {
        light: 'min-light',
        dark: jotaiTheme as any,
      },
    },
  },
});
