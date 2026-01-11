import * as core from "@actions/core";
import * as github from "@actions/github";
import { Octokit } from "@octokit/rest";
import { Kernl } from "kernl";

import { triager } from "@/agents/triage";
import { docster } from "@/agents/docster";

async function getCommitDiff(
  octokit: Octokit,
  owner: string,
  repo: string,
  sha: string,
): Promise<string> {
  const { data } = await octokit.repos.getCommit({
    owner,
    repo,
    ref: sha,
    mediaType: { format: "diff" },
  });

  // when using diff format, data is returned as a string
  return data as unknown as string;
}

async function main() {
  try {
    const token = core.getInput("github_token") || process.env.GITHUB_TOKEN;
    const anthropicKey =
      core.getInput("anthropic_api_key") || process.env.ANTHROPIC_API_KEY;
    const daytonaKey =
      core.getInput("daytona_api_key") || process.env.DAYTONA_API_KEY;
    const docsPath = core.getInput("docs_path") || "docs";

    if (!token || !anthropicKey || !daytonaKey) {
      throw new Error("Missing required env var(s)");
    }

    // Set API keys for SDKs
    process.env.GITHUB_TOKEN = token;
    process.env.ANTHROPIC_API_KEY = anthropicKey;
    process.env.DAYTONA_API_KEY = daytonaKey;

    const { owner, repo } = github.context.repo;
    const repoUrl = `https://github.com/${owner}/${repo}.git`;
    const ref = github.context.ref;
    const sha = github.context.sha;
    const shortSha = sha.substring(0, 7);
    const eventName = github.context.eventName;

    core.info(`Repository: ${owner}/${repo}`);
    core.info(`Event: ${eventName}`);
    core.info(`Ref: ${ref}`);
    core.info(`SHA: ${shortSha}`);

    const kernl = new Kernl();
    kernl.register(triager);
    kernl.register(docster);

    // Stage 1: Triage - check if docs need updating
    core.info("Stage 1: Analyzing diff...");

    const octokit = new Octokit({ auth: token });
    const diff = await getCommitDiff(octokit, owner, repo, sha);

    const tinstr = `
Analyze this commit diff and determine if documentation needs to be updated.

First, explore the repository to understand:
1. What the project is about (check README)
2. What documentation exists (list the docs folder if it exists)

Then analyze the diff in that context.

\`\`\`diff
${diff}
\`\`\`
`;

    const response = await triager.run(tinstr, {
      context: { owner, repo },
    });
    const triage = response.response;

    core.info(
      `Triage result: ${triage.needs_updating ? "needs update" : "no update needed"}`,
    );
    core.info(`Reason: ${triage.reason}`);

    if (!triage.needs_updating) {
      core.info("No documentation updates needed. Exiting.");
      return;
    }

    // Stage 2: Docster - update the docs
    core.info("Stage 2: Updating documentation...");

    const dinstr = `
Repository: ${repoUrl}
Owner: ${owner}
Repo: ${repo}
Event: ${eventName}
Ref: ${ref}
Commit SHA: ${shortSha}
Docs Path: ${docsPath}

Triage reason: ${triage.reason}

Clone the repository, analyze the recent changes, and update any documentation that needs to reflect those changes. Create a pull request with your updates.
`;

    await docster.run(dinstr, {
      context: {
        git: { username: "x-access-token", token },
        owner,
        repo,
      },
    });

    core.info("Docster completed successfully");
    core.info(JSON.stringify(triage, null, 2));
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed("An unknown error occurred");
    }
  }
}

main();
