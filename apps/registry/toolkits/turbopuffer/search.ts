import { z } from "zod";
import { tool } from "kernl";

import { tpuf, type TurbopufferContext } from "./client";
// import { embed } from "@kernl-sdk/retrieval";

/**
 * Define the query schema based on your searchable fields.
 * The agent can only search fields defined here.
 */
const QuerySchema = z.object({
  // content: z.string().optional().describe("Search the content field"),
  // title: z.string().optional().describe("Search the title field"),
});

/**
 * Define the filter schema based on your document structure.
 * The agent can only filter by fields defined here.
 */
const FilterSchema = z
  .object({
    // category: z.string().optional(),
    // published: z.boolean().optional(),
    // author: z.string().optional(),
  })
  .optional();

/**
 * @tool
 *
 * Searches documents by semantic similarity or full-text match.
 */
export const search = tool({
  id: "turbopuffer_search",
  description: "Search documents by semantic similarity or text",
  parameters: z.object({
    query: QuerySchema.describe("Search query by field"),
    filter: FilterSchema.describe("Filter criteria"),
    limit: z.number().default(10).describe("Maximum results to return"),
  }),
  execute: async (ctx: TurbopufferContext, params) => {
    const ns = tpuf.index(ctx.namespace);

    // Option 1: Vector search (embed the query first)
    // const { embedding } = await embed({
    //   model: "openai/text-embedding-3-small",
    //   text: params.query,
    // });
    // const hits = await ns.query({
    //   query: [{ vector: embedding }],
    //   filter: params.filter,
    //   topK: params.limit,
    // });

    // Option 2: Full-text search (BM25)
    //
    // Note: Turbopuffer does not support server-side hybrid search.
    // For hybrid (vector + BM25), run separate queries and fuse client-side.
    // See: https://turbopuffer.com/docs/hybrid
    return await ns.query({
      query: [params.query],
      filter: params.filter,
      topK: params.limit,
    });
  },
});
