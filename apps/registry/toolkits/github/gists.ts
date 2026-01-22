import { z } from "zod";
import { tool, Toolkit, Context } from "kernl";

import { octokit } from "./client";

/**
 * @tool
 *
 * Creates a new gist with one or more files.
 */
export const createGist = tool({
  id: "gists_create",
  description: "Create a new gist",
  parameters: z.object({
    description: z.string().optional().describe("Gist description"),
    files: z
      .record(z.string(), z.object({ content: z.string() }))
      .describe("Files to include (filename -> content)"),
    public: z.boolean().optional().describe("Whether the gist is public"),
  }),
  execute: async (ctx: Context, params) => {
    const { data } = await octokit.gists.create({
      description: params.description,
      files: params.files,
      public: params.public,
    });
    return {
      id: data.id,
      url: data.html_url,
      files: Object.keys(data.files ?? {}),
      public: data.public,
      created_at: data.created_at,
    };
  },
});

/**
 * @tool
 *
 * Retrieves a gist by its ID including file contents.
 */
export const getGist = tool({
  id: "gists_get",
  description: "Get a gist by ID",
  parameters: z.object({
    gist_id: z.string().describe("Gist ID"),
  }),
  execute: async (ctx: Context, params) => {
    const { data } = await octokit.gists.get({ gist_id: params.gist_id });
    return {
      id: data.id,
      url: data.html_url,
      description: data.description,
      files: Object.entries(data.files ?? {}).map(([name, file]) => ({
        filename: name,
        language: file?.language,
        size: file?.size,
        content: file?.content,
      })),
      public: data.public,
      owner: data.owner?.login,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  },
});

/**
 * @tool
 *
 * Lists gists for the authenticated user.
 */
export const listGists = tool({
  id: "gists_list",
  description: "List gists for the authenticated user",
  parameters: z.object({
    since: z.string().optional().describe("Filter by date (ISO 8601)"),
    page: z.number().optional().describe("Page number"),
    per_page: z.number().optional().describe("Results per page (max 100)"),
  }),
  execute: async (ctx: Context, params) => {
    const { data } = await octokit.gists.list(params);
    return data.map((gist) => ({
      id: gist.id,
      url: gist.html_url,
      description: gist.description,
      files: Object.keys(gist.files ?? {}),
      public: gist.public,
      created_at: gist.created_at,
      updated_at: gist.updated_at,
    }));
  },
});

/**
 * @tool
 *
 * Updates an existing gist's description or files.
 */
export const updateGist = tool({
  id: "gists_update",
  description: "Update an existing gist",
  parameters: z.object({
    gist_id: z.string().describe("Gist ID"),
    description: z.string().optional().describe("New description"),
    files: z
      .record(z.string(), z.object({ content: z.string().optional() }))
      .optional()
      .describe("Files to update (omit content to delete)"),
  }),
  execute: async (ctx: Context, params) => {
    const { data } = await octokit.gists.update(params);
    return {
      id: data.id,
      url: data.html_url,
      files: Object.keys(data.files ?? {}),
      updated_at: data.updated_at,
    };
  },
});

export const gists = new Toolkit({
  id: "gists",
  description: "GitHub Gists",
  tools: [createGist, getGist, listGists, updateGist],
});
