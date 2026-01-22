import { z } from "zod";
import { tool, Toolkit, Context } from "kernl";
import { octokit, getRepo, type GitHubContext } from "./client";

/**
 * @tool
 *
 * Lists discussion categories in the repository.
 */
export const listDiscussionCategories = tool({
  id: "discussions_list_categories",
  description: "List discussion categories in the repository",
  parameters: z.object({}),
  execute: async (ctx: Context<GitHubContext>) => {
    const { owner, repo } = getRepo(ctx);
    const { repository } = await octokit.graphql<{
      repository: {
        discussionCategories: {
          nodes: Array<{
            id: string;
            name: string;
            emoji: string;
            description: string;
            slug: string;
          }>;
        };
      };
    }>(
      `query($owner: String!, $repo: String!) {
        repository(owner: $owner, name: $repo) {
          discussionCategories(first: 25) {
            nodes {
              id
              name
              emoji
              description
              slug
            }
          }
        }
      }`,
      { owner, repo },
    );
    return repository.discussionCategories.nodes;
  },
});

/**
 * @tool
 *
 * Lists discussions in the repository with optional category filter.
 */
export const listDiscussions = tool({
  id: "discussions_list",
  description: "List discussions in the repository",
  parameters: z.object({
    category_id: z.string().optional().describe("Filter by category ID"),
    first: z
      .number()
      .optional()
      .describe("Number of discussions to return (max 100)"),
  }),
  execute: async (ctx: Context<GitHubContext>, params) => {
    const { owner, repo } = getRepo(ctx);
    const first = Math.min(params.first ?? 25, 100);

    const { repository } = await octokit.graphql<{
      repository: {
        discussions: {
          nodes: Array<{
            id: string;
            number: number;
            title: string;
            author: { login: string } | null;
            category: { name: string };
            createdAt: string;
            updatedAt: string;
            url: string;
            answerChosenAt: string | null;
          }>;
        };
      };
    }>(
      `query($owner: String!, $repo: String!, $first: Int!, $categoryId: ID) {
        repository(owner: $owner, name: $repo) {
          discussions(first: $first, categoryId: $categoryId) {
            nodes {
              id
              number
              title
              author { login }
              category { name }
              createdAt
              updatedAt
              url
              answerChosenAt
            }
          }
        }
      }`,
      { owner, repo, first, categoryId: params.category_id ?? null },
    );

    return repository.discussions.nodes.map((d) => ({
      id: d.id,
      number: d.number,
      title: d.title,
      author: d.author?.login,
      category: d.category.name,
      created_at: d.createdAt,
      updated_at: d.updatedAt,
      url: d.url,
      answered: !!d.answerChosenAt,
    }));
  },
});

/**
 * @tool
 *
 * Gets a specific discussion by number.
 */
export const getDiscussion = tool({
  id: "discussions_get",
  description: "Get a discussion by number",
  parameters: z.object({
    number: z.number().describe("Discussion number"),
  }),
  execute: async (ctx: Context<GitHubContext>, params) => {
    const { owner, repo } = getRepo(ctx);

    const { repository } = await octokit.graphql<{
      repository: {
        discussion: {
          id: string;
          number: number;
          title: string;
          body: string;
          author: { login: string } | null;
          category: { name: string };
          createdAt: string;
          updatedAt: string;
          url: string;
          answerChosenAt: string | null;
          upvoteCount: number;
          comments: { totalCount: number };
        } | null;
      };
    }>(
      `query($owner: String!, $repo: String!, $number: Int!) {
        repository(owner: $owner, name: $repo) {
          discussion(number: $number) {
            id
            number
            title
            body
            author { login }
            category { name }
            createdAt
            updatedAt
            url
            answerChosenAt
            upvoteCount
            comments { totalCount }
          }
        }
      }`,
      { owner, repo, number: params.number },
    );

    if (!repository.discussion) {
      throw new Error(`Discussion #${params.number} not found`);
    }

    const d = repository.discussion;
    return {
      id: d.id,
      number: d.number,
      title: d.title,
      body: d.body,
      author: d.author?.login,
      category: d.category.name,
      created_at: d.createdAt,
      updated_at: d.updatedAt,
      url: d.url,
      answered: !!d.answerChosenAt,
      upvotes: d.upvoteCount,
      comment_count: d.comments.totalCount,
    };
  },
});

/**
 * @tool
 *
 * Gets comments on a discussion.
 */
export const getDiscussionComments = tool({
  id: "discussions_get_comments",
  description: "Get comments on a discussion",
  parameters: z.object({
    number: z.number().describe("Discussion number"),
    first: z
      .number()
      .optional()
      .describe("Number of comments to return (max 100)"),
  }),
  execute: async (ctx: Context<GitHubContext>, params) => {
    const { owner, repo } = getRepo(ctx);
    const first = Math.min(params.first ?? 25, 100);

    const { repository } = await octokit.graphql<{
      repository: {
        discussion: {
          comments: {
            nodes: Array<{
              id: string;
              author: { login: string } | null;
              body: string;
              createdAt: string;
              isAnswer: boolean;
              upvoteCount: number;
            }>;
          };
        } | null;
      };
    }>(
      `query($owner: String!, $repo: String!, $number: Int!, $first: Int!) {
        repository(owner: $owner, name: $repo) {
          discussion(number: $number) {
            comments(first: $first) {
              nodes {
                id
                author { login }
                body
                createdAt
                isAnswer
                upvoteCount
              }
            }
          }
        }
      }`,
      { owner, repo, number: params.number, first },
    );

    if (!repository.discussion) {
      throw new Error(`Discussion #${params.number} not found`);
    }

    return repository.discussion.comments.nodes.map((c) => ({
      id: c.id,
      author: c.author?.login,
      body: c.body,
      created_at: c.createdAt,
      is_answer: c.isAnswer,
      upvotes: c.upvoteCount,
    }));
  },
});

/**
 * GitHub Discussions toolkit.
 *
 * Provides tools for reading and browsing GitHub Discussions, which are
 * threaded conversations for Q&A, announcements, and community engagement.
 *
 * Tools:
 * - listDiscussionCategories: Get available discussion categories
 * - listDiscussions: Browse discussions with optional category filter
 * - getDiscussion: Get full discussion details including body and metadata
 * - getDiscussionComments: Read comments and answers on a discussion
 */
export const discussions = new Toolkit<GitHubContext>({
  id: "discussions",
  description: "GitHub Discussions",
  tools: [
    listDiscussionCategories,
    listDiscussions,
    getDiscussion,
    getDiscussionComments,
  ],
});
