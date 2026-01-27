import { z } from "zod";
import { tool, Toolkit, type Context } from "kernl";

import { supermemory, getUserId, type SupermemoryContext } from "./client";

const MetadataSchema = z
  .record(
    z.string(),
    z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
  )
  .optional();

/**
 * @tool
 *
 * Add a document to Supermemory.
 */
export const add = tool({
  id: "supermemory_documents_add",
  description:
    "Add a document to the knowledge base. Provide EITHER content OR url, not both.",
  parameters: z
    .object({
      content: z
        .string()
        .optional()
        .describe("Plaintext content to add (use this OR url)"),
      url: z
        .url()
        .optional()
        .describe(
          "URL to a website, PDF, image, or video (use this OR content)",
        ),
      metadata: MetadataSchema.describe("Optional metadata"),
    })
    .refine((data) => Boolean(data.content) !== Boolean(data.url), {
      message: "Provide either content or url, not both",
    }),
  async execute(ctx: Context<SupermemoryContext>, { content, url, metadata }) {
    const uid = getUserId(ctx.context);
    return await supermemory.documents.add({
      content: content ?? url!,
      containerTag: uid,
      metadata,
    });
  },
});

/**
 * @tool
 *
 * Get a document by ID.
 */
export const get = tool({
  id: "supermemory_documents_get",
  description: "Get a document by its ID (metadata only by default)",
  parameters: z.object({
    id: z.string().describe("The document ID"),
    include_content: z
      .boolean()
      .default(false)
      .describe("Include full document content (can be large)"),
  }),
  async execute(ctx: Context<SupermemoryContext>, { id, include_content }) {
    const doc = await supermemory.documents.get(id);
    if (!include_content) {
      const { content, ...metadata } = doc;
      return metadata;
    }
    return doc;
  },
});

/**
 * @tool
 *
 * List documents.
 */
export const list = tool({
  id: "supermemory_documents_list",
  description: "List documents with optional pagination and sorting",
  parameters: z.object({
    limit: z
      .number()
      .min(1)
      .max(100)
      .default(20)
      .describe("Number of documents per page"),
    cursor: z.number().min(1).default(1).describe("Page number to fetch"),
    sort: z
      .enum(["createdAt", "updatedAt"])
      .optional()
      .describe("Field to sort by"),
    order: z.enum(["asc", "desc"]).optional().describe("Sort order"),
  }),
  async execute(
    ctx: Context<SupermemoryContext>,
    { limit, cursor, sort, order },
  ) {
    const uid = getUserId(ctx.context);
    return await supermemory.documents.list({
      limit,
      page: cursor,
      containerTags: [uid],
      sort,
      order,
    });
  },
});

/**
 * @tool
 *
 * Update a document.
 */
export const update = tool({
  id: "supermemory_documents_update",
  description:
    "Update a document's content or metadata. Provide content OR url, not both.",
  parameters: z
    .object({
      id: z.string().describe("The document ID to update"),
      content: z
        .string()
        .optional()
        .describe("New plaintext content (use this OR url)"),
      url: z
        .url()
        .optional()
        .describe("New URL to ingest (use this OR content)"),
      metadata: MetadataSchema.describe("New metadata"),
    })
    .refine((data) => !(data.content && data.url), {
      message: "Provide content or url, not both",
    }),
  async execute(
    ctx: Context<SupermemoryContext>,
    { id, content, url, metadata },
  ) {
    const uid = getUserId(ctx.context);
    return await supermemory.documents.update(id, {
      content: content ?? url,
      containerTag: uid,
      metadata,
    });
  },
});

/**
 * @tool
 *
 * Delete a document.
 */
export const rm = tool({
  id: "supermemory_documents_delete",
  description: "Delete a document by its ID",
  parameters: z.object({
    id: z.string().describe("The document ID to delete"),
  }),
  async execute(ctx: Context<SupermemoryContext>, { id }) {
    await supermemory.documents.delete(id);
    return { success: true, id };
  },
});

/**
 * @tool
 *
 * Search documents semantically.
 */
export const search = tool({
  id: "supermemory_documents_search",
  description: "Search documents semantically",
  parameters: z.object({
    q: z.string().describe("The search query"),
    limit: z
      .number()
      .min(1)
      .max(100)
      .default(10)
      .describe("Maximum number of results to return"),
    doc_id: z
      .string()
      .optional()
      .describe("Search within a specific document (for large docs)"),
    include_summary: z
      .boolean()
      .optional()
      .describe("Include document summaries in results"),
    rerank: z
      .boolean()
      .optional()
      .describe("Rerank results by relevance (more accurate)"),
  }),
  async execute(
    ctx: Context<SupermemoryContext>,
    { q, limit, doc_id, include_summary, rerank },
  ) {
    const uid = getUserId(ctx.context);
    return await supermemory.search.documents({
      q,
      limit,
      containerTags: [uid],
      docId: doc_id,
      includeSummary: include_summary,
      rerank,
    });
  },
});

export const documents = new Toolkit<SupermemoryContext>({
  id: "supermemory_documents",
  description: "Document storage and search for Supermemory",
  tools: [add, get, list, update, rm, search],
});
