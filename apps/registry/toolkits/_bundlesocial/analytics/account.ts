import { z } from "zod";
import { tool } from "kernl";

import { client, TEAM_ID } from "../client";

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

export const getAccountAnalytics = tool({
  id: "analytics_account",
  description: "Get analytics for a connected social account",
  parameters: z.object({
    platform: z.enum(analyticsPlatforms).describe("Platform to get analytics from"),
  }),
  execute: async (ctx, params) => {
    const result = await client.analytics.analyticsGetSocialAccountAnalytics({
      teamId: TEAM_ID,
      platformType: params.platform,
    });

    const latest = result.items?.[0];

    return {
      account: {
        id: result.socialAccount.id,
        username: result.socialAccount.username,
        display_name: result.socialAccount.displayName,
        avatar_url: result.socialAccount.avatarUrl,
      },
      metrics: latest
        ? {
            followers: latest.followers,
            following: latest.following,
            post_count: latest.postCount,
            impressions: latest.impressions,
            views: latest.views,
            likes: latest.likes,
            comments: latest.comments,
            updated_at: latest.updatedAt,
          }
        : null,
    };
  },
});
