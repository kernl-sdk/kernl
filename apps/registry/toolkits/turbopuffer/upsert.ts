import { z } from "zod";
import { tool } from "kernl";

import { tpuf, type TurbopufferContext } from "./client";

/**
 * Define the document schema based on your namespace structure.
 * The agent can only upsert documents matching this schema.
 */
const DocumentSchema = z.object({
  id: z.string().describe("Unique document identifier"),
  title: z.string().describe("Document title"),
  content: z.string().describe("Document content"),
  category: z.string().optional().describe("Document category"),
});

/**
 * @tool
 *
 * Inserts or updates a document in the search index.
 */
export const upsert = tool({
  id: "upsert",
  description: "Insert or update a document in the search index",
  parameters: z.object({
    document: DocumentSchema.describe("Document to upsert"),
  }),
  execute: async (ctx: TurbopufferContext, params) => {
    const ns = tpuf.index(ctx.namespace);

    // For vector search, embed the document content first:
    // const { embedding } = await embed({
    //   model: "openai/text-embedding-3-small",
    //   text: params.document.content,
    // });
    // const doc = { ...params.document, vector: embedding };

    return await ns.upsert(params.document);
  },
});
