import { z } from "zod";
import { tool, Toolkit } from "kernl";
import { octokit } from "./client";

export const createGist = tool({
  id: "github_gists_create",
  description: "Create a new gist",
  parameters: z.object({
    description: z.string().optional().describe("Gist description"),
    files: z
      .record(z.string(), z.object({ content: z.string() }))
      .describe("Files to include (filename -> content)"),
    public: z.boolean().optional().describe("Whether the gist is public"),
  }),
  execute: async (_ctx, { description, files, public: isPublic }) => {
    const { data } = await octokit.gists.create({
      description,
      files,
      public: isPublic,
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

export const getGist = tool({
  id: "github_gists_get",
  description: "Get a gist by ID",
  parameters: z.object({
    gist_id: z.string().describe("Gist ID"),
  }),
  execute: async (_ctx, { gist_id }) => {
    const { data } = await octokit.gists.get({ gist_id });
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

export const listGists = tool({
  id: "github_gists_list",
  description: "List gists for the authenticated user",
  parameters: z.object({
    since: z.string().optional().describe("Filter by date (ISO 8601)"),
    page: z.number().optional().describe("Page number"),
    per_page: z.number().optional().describe("Results per page (max 100)"),
  }),
  execute: async (_ctx, { since, page, per_page }) => {
    const { data } = await octokit.gists.list({ since, page, per_page });
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

export const updateGist = tool({
  id: "github_gists_update",
  description: "Update an existing gist",
  parameters: z.object({
    gist_id: z.string().describe("Gist ID"),
    description: z.string().optional().describe("New description"),
    files: z
      .record(z.string(), z.object({ content: z.string().optional() }))
      .optional()
      .describe("Files to update (omit content to delete)"),
  }),
  execute: async (_ctx, { gist_id, description, files }) => {
    const { data } = await octokit.gists.update({
      gist_id,
      description,
      files,
    });
    return {
      id: data.id,
      url: data.html_url,
      files: Object.keys(data.files ?? {}),
      updated_at: data.updated_at,
    };
  },
});

export const gists = new Toolkit({
  id: "github_gists",
  description: "GitHub Gists",
  tools: [createGist, getGist, listGists, updateGist],
});
