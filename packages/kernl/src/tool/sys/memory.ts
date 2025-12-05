/**
 * Memory system toolkit.
 *
 * Provides tools for agents to store and retrieve memories.
 * Enabled via `memory: true` in agent config.
 */

import assert from "assert";
import { z } from "zod";

import { tool } from "../tool";
import { Toolkit } from "../toolkit";

// --- Tools ---

/**
 * Search memories for relevant information using natural language.
 */
const search = tool({
  id: "memories.search",
  description:
    "Search your memories. " +
    "Use this to recall facts, preferences, or context you've previously stored.",
  parameters: z.object({
    query: z.string().describe("Natural language search query"),
    limit: z
      .number()
      .int()
      .positive()
      .optional()
      .describe("Max results (default: 10)"),
  }),
  execute: async (ctx, { query, limit }) => {
    assert(ctx.agent, "ctx.agent required for memory tools");

    const mems = await ctx.agent.memories.search({
      query,
      limit: limit ?? 10,
    });

    return mems.map((h) => ({
      id: h.document?.id,
      text: h.document?.text,
      score: h.score,
    }));
  },
});

/**
 * Store a new memory to persist across conversations.
 */
const create = tool({
  id: "memories.create",
  description:
    "Store a new memory. Use this to remember important facts, user preferences, " +
    "or context that should persist across conversations.",
  parameters: z.object({
    content: z.string().describe("Text content to remember"),
    collection: z
      .string()
      .optional()
      .describe("Category for organizing memories (default: 'facts')"),
  }),
  execute: async (ctx, { content, collection }) => {
    assert(ctx.agent, "ctx.agent required for memory tools");

    const mem = await ctx.agent.memories.create({
      collection: collection ?? "facts",
      content: { text: content },
    });

    return { id: mem.id, stored: true };
  },
});

/**
 * Update an existing memory.
 */
const update = tool({
  id: "memories.update",
  description:
    "Update an existing memory. Use this to correct or modify previously " +
    "stored facts or preferences.",
  parameters: z.object({
    id: z.string().describe("ID of the memory to update"),
    content: z.string().optional().describe("New text content"),
    collection: z.string().optional().describe("New collection category"),
  }),
  execute: async (ctx, { id, content, collection }) => {
    assert(ctx.agent, "ctx.agent required for memory tools");

    const mem = await ctx.agent.memories.update({
      id,
      content: content ? { text: content } : undefined,
      collection,
    });

    return { id: mem.id, updated: true };
  },
});

/**
 * List stored memories, optionally filtered by collection.
 */
const list = tool({
  id: "memories.list",
  description:
    "List your stored memories. Use this to see what you've remembered, " +
    "optionally filtered by collection.",
  parameters: z.object({
    collection: z.string().optional().describe("Filter by collection name"),
    limit: z
      .number()
      .int()
      .positive()
      .optional()
      .describe("Max results (default: 20)"),
  }),
  execute: async (ctx, { collection, limit }) => {
    assert(ctx.agent, "ctx.agent required for memory tools");

    const mems = await ctx.agent.memories.list({
      collection,
      limit: limit ?? 20,
    });

    return mems.map((r) => ({
      id: r.id,
      collection: r.collection,
      text: r.content.text,
    }));
  },
});

// --- Toolkit ---

/**
 * Memory system toolkit.
 *
 * Provides memories.list, memories.create, memories.update, and memories.search tools.
 */
export const memory = new Toolkit({
  id: "sys.memory",
  description: "Tools for storing and retrieving agent memories",
  tools: [list, create, update, search],
});
