import { Bundlesocial } from "bundlesocial";
import { beforeAll, afterAll } from "vitest";

export const TEST_TEAM_ID = process.env.BUNDLESOCIAL_TEAM_ID;

export function getClient() {
  const apiKey = process.env.BUNDLESOCIAL_API_KEY;
  if (!apiKey) {
    throw new Error("BUNDLESOCIAL_API_KEY is required for integration tests");
  }
  return new Bundlesocial(apiKey);
}

export function skipIfNoCredentials() {
  if (!process.env.BUNDLESOCIAL_API_KEY || !process.env.BUNDLESOCIAL_TEAM_ID) {
    return true;
  }
  return false;
}

// Track resources created during tests for cleanup
const createdPosts: string[] = [];
const createdComments: string[] = [];

export function trackPost(id: string) {
  createdPosts.push(id);
}

export function trackComment(id: string) {
  createdComments.push(id);
}

export async function cleanup() {
  if (skipIfNoCredentials()) return;

  const client = getClient();

  for (const id of createdPosts) {
    try {
      await client.post.postDelete({ id });
    } catch {
      // ignore cleanup errors
    }
  }

  for (const id of createdComments) {
    try {
      await client.comment.commentDelete({ id });
    } catch {
      // ignore cleanup errors
    }
  }

  createdPosts.length = 0;
  createdComments.length = 0;
}
