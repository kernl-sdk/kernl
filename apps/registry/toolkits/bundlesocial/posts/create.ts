import { z } from "zod";
import { tool } from "kernl";
import type { PostCreateData } from "bundlesocial";

import { client, TEAM_ID } from "../client";
import { PLATFORMS } from "../constants";

type PlatformData = NonNullable<PostCreateData["requestBody"]>["data"];

const platformDataSchema = z.object({
  TWITTER: z
    .object({
      text: z.string().optional(),
      uploadIds: z.array(z.string()).optional(),
    })
    .optional(),
  LINKEDIN: z
    .object({
      text: z.string(),
      uploadIds: z.array(z.string()).optional(),
      privacy: z.enum(["PUBLIC", "CONNECTIONS"]).optional(),
    })
    .optional(),
  INSTAGRAM: z
    .object({
      type: z.enum(["POST", "REEL", "STORY"]).optional(),
      text: z.string().optional(),
      uploadIds: z.array(z.string()).optional(),
    })
    .optional(),
  FACEBOOK: z
    .object({
      type: z.enum(["POST", "REEL", "STORY"]).optional(),
      text: z.string().optional(),
      uploadIds: z.array(z.string()).optional(),
      link: z.string().optional(),
    })
    .optional(),
  TIKTOK: z
    .object({
      type: z.enum(["VIDEO", "IMAGE"]).optional(),
      text: z.string().optional(),
      uploadIds: z.array(z.string()).optional(),
      privacy: z
        .enum([
          "SELF_ONLY",
          "PUBLIC_TO_EVERYONE",
          "MUTUAL_FOLLOW_FRIENDS",
          "FOLLOWER_OF_CREATOR",
        ])
        .optional(),
    })
    .optional(),
  YOUTUBE: z
    .object({
      text: z.string().optional(),
      title: z.string().optional(),
      uploadIds: z.array(z.string()).optional(),
      privacy: z.enum(["PUBLIC", "UNLISTED", "PRIVATE"]).optional(),
    })
    .optional(),
  THREADS: z
    .object({
      text: z.string().optional(),
      uploadIds: z.array(z.string()).optional(),
    })
    .optional(),
  PINTEREST: z
    .object({
      boardName: z.string(),
      text: z.string().optional(),
      description: z.string().optional(),
      uploadIds: z.array(z.string()).optional(),
      link: z.string().optional(),
    })
    .optional(),
  REDDIT: z
    .object({
      sr: z.string().describe("Subreddit name"),
      text: z.string(),
      description: z.string().optional(),
      uploadIds: z.array(z.string()).optional(),
      link: z.string().optional(),
      nsfw: z.boolean().optional(),
      flairId: z.string().optional(),
    })
    .optional(),
  MASTODON: z
    .object({
      text: z.string().optional(),
      uploadIds: z.array(z.string()).optional(),
      spoilerText: z.string().optional(),
    })
    .optional(),
  DISCORD: z
    .object({
      text: z.string().optional(),
      uploadIds: z.array(z.string()).optional(),
    })
    .optional(),
  SLACK: z
    .object({
      text: z.string().optional(),
      uploadIds: z.array(z.string()).optional(),
    })
    .optional(),
  BLUESKY: z
    .object({
      text: z.string().optional(),
      uploadIds: z.array(z.string()).optional(),
      tags: z.array(z.string()).max(8).optional(),
    })
    .optional(),
  GOOGLE_BUSINESS: z
    .object({
      text: z.string().optional(),
      uploadIds: z.array(z.string()).optional(),
    })
    .optional(),
});

export const createPost = tool({
  id: "bundlesocial_posts_create",
  description:
    "Create and schedule a post across multiple social media platforms",
  parameters: z.object({
    title: z.string().describe("Internal title for the post"),
    post_date: z
      .string()
      .describe(
        "ISO 8601 datetime for when to publish (e.g. '2024-01-15T10:00:00Z')",
      ),
    status: z
      .enum(["DRAFT", "SCHEDULED"])
      .describe(
        "DRAFT to save without scheduling, SCHEDULED to queue for publishing",
      ),
    platforms: z
      .array(z.enum(PLATFORMS))
      .min(1)
      .describe("Platforms to publish to"),
    data: platformDataSchema.describe(
      "Platform-specific content configuration",
    ),
  }),
  execute: async (ctx, params) => {
    const post = await client.post.postCreate({
      requestBody: {
        teamId: TEAM_ID,
        title: params.title,
        postDate: params.post_date,
        status: params.status,
        socialAccountTypes: params.platforms,
        data: params.data as PlatformData,
      },
    });

    return {
      id: post.id,
      title: post.title,
      status: post.status,
      post_date: post.postDate,
      platforms: params.platforms,
    };
  },
});
