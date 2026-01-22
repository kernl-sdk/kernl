import { z } from "zod";
import { tool } from "kernl";

import { client } from "../client";

const analyticsPlatforms = [
  "TIKTOK",
  "YOUTUBE",
  "INSTAGRAM",
  "FACEBOOK",
  "THREADS",
  "REDDIT",
  "PINTEREST",
  "MASTODON",
  "LINKEDIN",
  "BLUESKY",
  "GOOGLE_BUSINESS",
] as const;

export const getPostAnalytics = tool({
  id: "analytics_post",
  description: "Get performance analytics for a specific post",
  parameters: z.object({
    post_id: z.string().describe("Post ID to get analytics for"),
    platform: z.enum(analyticsPlatforms).describe("Platform to get analytics from"),
  }),
  execute: async (ctx, params) => {
    const result = await client.analytics.analyticsGetPostAnalytics({
      postId: params.post_id,
      platformType: params.platform,
    });

    const latest = result.items?.[0];

    return {
      post: {
        id: result.post.id,
        title: result.post.title,
        status: result.post.status,
        posted_date: result.post.postedDate,
      },
      metrics: latest
        ? {
            impressions: latest.impressions,
            views: latest.views,
            likes: latest.likes,
            dislikes: latest.dislikes,
            comments: latest.comments,
            shares: latest.shares,
            saves: latest.saves,
            updated_at: latest.updatedAt,
          }
        : null,
    };
  },
});
