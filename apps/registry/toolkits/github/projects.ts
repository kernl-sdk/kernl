import { z } from "zod";
import { tool, Toolkit, Context } from "kernl";
import { octokit, getRepo, type GitHubContext } from "./client";

/**
 * @tool
 *
 * Lists projects (v2) for the repository or organization.
 */
export const listProjects = tool({
  id: "github_projects_list",
  description: "List GitHub Projects (v2) for the repository",
  parameters: z.object({
    first: z.number().optional().describe("Number of projects to return (max 100)"),
  }),
  execute: async (ctx: Context<GitHubContext>, params) => {
    const { owner, repo } = getRepo(ctx);
    const first = Math.min(params.first ?? 20, 100);

    const { repository } = await octokit.graphql<{
      repository: {
        projectsV2: {
          nodes: Array<{
            id: string;
            number: number;
            title: string;
            shortDescription: string | null;
            url: string;
            closed: boolean;
            createdAt: string;
            updatedAt: string;
          }>;
        };
      };
    }>(
      `query($owner: String!, $repo: String!, $first: Int!) {
        repository(owner: $owner, name: $repo) {
          projectsV2(first: $first) {
            nodes {
              id
              number
              title
              shortDescription
              url
              closed
              createdAt
              updatedAt
            }
          }
        }
      }`,
      { owner, repo, first },
    );

    return repository.projectsV2.nodes.map((p) => ({
      id: p.id,
      number: p.number,
      title: p.title,
      description: p.shortDescription,
      url: p.url,
      closed: p.closed,
      created_at: p.createdAt,
      updated_at: p.updatedAt,
    }));
  },
});

/**
 * @tool
 *
 * Gets a specific project by number.
 */
export const getProject = tool({
  id: "github_projects_get",
  description: "Get a GitHub Project (v2) by number",
  parameters: z.object({
    number: z.number().describe("Project number"),
  }),
  execute: async (ctx: Context<GitHubContext>, params) => {
    const { owner, repo } = getRepo(ctx);

    const { repository } = await octokit.graphql<{
      repository: {
        projectV2: {
          id: string;
          number: number;
          title: string;
          shortDescription: string | null;
          readme: string | null;
          url: string;
          closed: boolean;
          createdAt: string;
          updatedAt: string;
          items: { totalCount: number };
          fields: {
            nodes: Array<{
              __typename: string;
              id: string;
              name: string;
            }>;
          };
        } | null;
      };
    }>(
      `query($owner: String!, $repo: String!, $number: Int!) {
        repository(owner: $owner, name: $repo) {
          projectV2(number: $number) {
            id
            number
            title
            shortDescription
            readme
            url
            closed
            createdAt
            updatedAt
            items { totalCount }
            fields(first: 20) {
              nodes {
                __typename
                ... on ProjectV2Field { id name }
                ... on ProjectV2IterationField { id name }
                ... on ProjectV2SingleSelectField { id name }
              }
            }
          }
        }
      }`,
      { owner, repo, number: params.number },
    );

    if (!repository.projectV2) {
      throw new Error(`Project #${params.number} not found`);
    }

    const p = repository.projectV2;
    return {
      id: p.id,
      number: p.number,
      title: p.title,
      description: p.shortDescription,
      readme: p.readme,
      url: p.url,
      closed: p.closed,
      created_at: p.createdAt,
      updated_at: p.updatedAt,
      item_count: p.items.totalCount,
      fields: p.fields.nodes.map((f) => ({
        id: f.id,
        name: f.name,
        type: f.__typename.replace("ProjectV2", "").replace("Field", ""),
      })),
    };
  },
});

/**
 * @tool
 *
 * Lists items in a project.
 */
export const listProjectItems = tool({
  id: "github_projects_list_items",
  description: "List items in a GitHub Project (v2)",
  parameters: z.object({
    number: z.number().describe("Project number"),
    first: z.number().optional().describe("Number of items to return (max 100)"),
  }),
  execute: async (ctx: Context<GitHubContext>, params) => {
    const { owner, repo } = getRepo(ctx);
    const first = Math.min(params.first ?? 50, 100);

    const { repository } = await octokit.graphql<{
      repository: {
        projectV2: {
          items: {
            nodes: Array<{
              id: string;
              type: string;
              createdAt: string;
              updatedAt: string;
              content: {
                __typename: string;
                title?: string;
                number?: number;
                state?: string;
                url?: string;
              } | null;
            }>;
          };
        } | null;
      };
    }>(
      `query($owner: String!, $repo: String!, $number: Int!, $first: Int!) {
        repository(owner: $owner, name: $repo) {
          projectV2(number: $number) {
            items(first: $first) {
              nodes {
                id
                type
                createdAt
                updatedAt
                content {
                  __typename
                  ... on Issue { title number state url }
                  ... on PullRequest { title number state url }
                  ... on DraftIssue { title }
                }
              }
            }
          }
        }
      }`,
      { owner, repo, number: params.number, first },
    );

    if (!repository.projectV2) {
      throw new Error(`Project #${params.number} not found`);
    }

    return repository.projectV2.items.nodes.map((item) => ({
      id: item.id,
      type: item.type,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
      content: item.content
        ? {
            type: item.content.__typename,
            title: item.content.title,
            number: item.content.number,
            state: item.content.state,
            url: item.content.url,
          }
        : null,
    }));
  },
});

/**
 * @tool
 *
 * Gets the fields/columns available in a project.
 */
export const listProjectFields = tool({
  id: "github_projects_list_fields",
  description: "List fields in a GitHub Project (v2)",
  parameters: z.object({
    number: z.number().describe("Project number"),
  }),
  execute: async (ctx: Context<GitHubContext>, params) => {
    const { owner, repo } = getRepo(ctx);

    const { repository } = await octokit.graphql<{
      repository: {
        projectV2: {
          fields: {
            nodes: Array<{
              __typename: string;
              id: string;
              name: string;
              options?: Array<{ id: string; name: string }>;
            }>;
          };
        } | null;
      };
    }>(
      `query($owner: String!, $repo: String!, $number: Int!) {
        repository(owner: $owner, name: $repo) {
          projectV2(number: $number) {
            fields(first: 50) {
              nodes {
                __typename
                ... on ProjectV2Field { id name }
                ... on ProjectV2IterationField { id name }
                ... on ProjectV2SingleSelectField { id name options { id name } }
              }
            }
          }
        }
      }`,
      { owner, repo, number: params.number },
    );

    if (!repository.projectV2) {
      throw new Error(`Project #${params.number} not found`);
    }

    return repository.projectV2.fields.nodes.map((f) => ({
      id: f.id,
      name: f.name,
      type: f.__typename.replace("ProjectV2", "").replace("Field", "") || "Text",
      options: f.options,
    }));
  },
});

/**
 * GitHub Projects (v2) toolkit.
 *
 * Provides tools for reading GitHub Projects, the flexible planning and
 * tracking system for organizing issues, PRs, and draft items.
 *
 * Tools:
 * - listProjects: List projects in a repository
 * - getProject: Get project details including field configuration
 * - listProjectItems: Browse items (issues, PRs, drafts) in a project
 * - listProjectFields: Get available fields and their options
 */
export const projects = new Toolkit<GitHubContext>({
  id: "github_projects",
  description: "GitHub Projects (v2)",
  tools: [listProjects, getProject, listProjectItems, listProjectFields],
});
