import { Octokit } from "@octokit/rest";
import type { Context } from "kernl";

/**
 * GitHub context extension for repository operations.
 */
export interface RepoContext {
  owner: string;
  repo: string;
}

/**
 * Gets repo info from context.
 */
export function getRepo(ctx: Context<RepoContext>): { owner: string; repo: string } {
  const { owner, repo } = ctx.context;

  if (!owner || !repo) {
    throw new Error(
      "GitHub repo context not set. Set ctx.context.owner and ctx.context.repo before using GitHub tools.",
    );
  }

  return { owner, repo };
}

/**
 * Singleton Octokit client using GITHUB_TOKEN from environment.
 *
 * For multi-tenant scenarios (GitHub App installations), create your own
 * Octokit instance with per-installation tokens:
 *
 * ```typescript
 * import { createAppAuth } from "@octokit/auth-app";
 * import { Octokit } from "@octokit/rest";
 *
 * const appAuth = createAppAuth({
 *   appId: process.env.GITHUB_APP_ID!,
 *   privateKey: process.env.GITHUB_PRIVATE_KEY!,
 * });
 *
 * async function getInstallationClient(installationId: number) {
 *   const { token } = await appAuth({ type: "installation", installationId });
 *   return new Octokit({ auth: token });
 * }
 * ```
 */
export const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});
