import { z } from "zod";
import { tool, Toolkit, type Context } from "kernl";

import { supermemory, getUserId, type SupermemoryContext } from "./client";

/**
 * @tool
 *
 * Add a memory.
 */
export const add = tool({
  id: "supermemory_memories_add",
  description:
    "Store a new memory. Use this to remember important facts, " +
    "user preferences, or context that should persist. Provide EITHER content OR url, not both.",
  parameters: z
    .object({
      content: z
        .string()
        .optional()
        .describe("Text content to remember (use this OR url)"),
      url: z.url().optional().describe("URL to remember (use this OR content)"),
    })
    .refine((data) => Boolean(data.content) !== Boolean(data.url), {
      message: "Provide either content or url, not both",
    }),
  async execute(ctx: Context<SupermemoryContext>, { content, url }) {
    const uid = getUserId(ctx.context);
    const response = await supermemory.memories.add({
      content: content ?? url!,
      containerTags: [uid],
    });
    return { id: response.id, stored: true };
  },
});

/**
 * @tool
 *
 * Get a memory by ID.
 */
export const get = tool({
  id: "supermemory_memories_get",
  description: "Retrieve a specific memory by its ID.",
  parameters: z.object({
    id: z.string().describe("ID of the memory to retrieve"),
  }),
  async execute(ctx: Context<SupermemoryContext>, { id }) {
    const memory = await supermemory.memories.get(id);
    return {
      id: memory.id,
      content: memory.content,
      title: memory.title,
      type: memory.type,
    };
  },
});

/**
 * @tool
 *
 * List memories.
 */
export const list = tool({
  id: "supermemory_memories_list",
  description: "List stored memories with optional pagination.",
  parameters: z.object({
    limit: z
      .number()
      .min(1)
      .max(100)
      .default(20)
      .describe("Max results (default: 20)"),
    sort: z
      .enum(["createdAt", "updatedAt"])
      .optional()
      .describe("Field to sort by"),
    order: z.enum(["asc", "desc"]).optional().describe("Sort order"),
  }),
  async execute(ctx: Context<SupermemoryContext>, { limit, sort, order }) {
    const uid = getUserId(ctx.context);
    const response = await supermemory.memories.list({
      containerTags: [uid],
      limit,
      sort,
      order,
    });
    return response.memories.map((m) => ({
      id: m.id,
      content: m.content,
      title: m.title,
      type: m.type,
    }));
  },
});

/**
 * @tool
 *
 * Update a memory.
 */
export const update = tool({
  id: "supermemory_memories_update",
  description:
    "Update an existing memory. Use this to correct or modify " +
    "previously stored information.",
  parameters: z.object({
    id: z.string().describe("ID of the memory to update"),
    content: z.string().optional().describe("New text content"),
  }),
  async execute(ctx: Context<SupermemoryContext>, { id, content }) {
    await supermemory.memories.update(id, { content });
    return { id, updated: true };
  },
});

/**
 * @tool
 *
 * Delete a memory.
 */
export const rm = tool({
  id: "supermemory_memories_delete",
  description: "Permanently delete a memory by its ID.",
  parameters: z.object({
    id: z.string().describe("ID of the memory to delete"),
  }),
  async execute(ctx: Context<SupermemoryContext>, { id }) {
    await supermemory.memories.delete(id);
    return { id, deleted: true };
  },
});

/**
 * @tool
 *
 * Forget a memory (soft delete).
 */
export const forget = tool({
  id: "supermemory_memories_forget",
  description:
    "Forget a memory (soft delete). The memory is marked as forgotten but not " +
    "permanently deleted. Use this when you want to stop recalling something " +
    "but may need to recover it later.",
  parameters: z
    .object({
      id: z.string().optional().describe("ID of the memory to forget"),
      content: z
        .string()
        .optional()
        .describe(
          "Exact content match to forget (use when you don't have the ID)",
        ),
      reason: z.string().optional().describe("Optional reason for forgetting"),
    })
    .refine((data) => Boolean(data.id) || Boolean(data.content), {
      message: "Provide either id or content to identify the memory",
    }),
  async execute(ctx: Context<SupermemoryContext>, { id, content, reason }) {
    const uid = getUserId(ctx.context);
    return await supermemory.memories.forget({
      containerTag: uid,
      id,
      content,
      reason,
    });
  },
});

/**
 * @tool
 *
 * Search memories semantically.
 */
export const search = tool({
  id: "supermemory_memories_search",
  description:
    "Search memories using natural language. " +
    "Use this to recall facts, preferences, or context.",
  parameters: z.object({
    q: z.string().describe("Natural language search query"),
    limit: z
      .number()
      .min(1)
      .max(100)
      .default(10)
      .describe("Max results (default: 10)"),
  }),
  async execute(ctx: Context<SupermemoryContext>, { q, limit }) {
    const uid = getUserId(ctx.context);
    const response = await supermemory.search.memories({
      q,
      containerTag: uid,
      limit,
    });
    return response.results.map((r) => ({
      id: r.id,
      content: r.memory,
      score: r.similarity,
    }));
  },
});

export const memory = new Toolkit<SupermemoryContext>({
  id: "supermemory.memory",
  description: "Memory storage and search for Supermemory",
  tools: [add, get, list, update, rm, forget, search],
});
