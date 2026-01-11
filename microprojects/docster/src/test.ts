import { Octokit } from "@octokit/rest";
import { Kernl } from "kernl";

import { triager, type TriageResult } from "@/agents/triage";
import { docster } from "@/agents/docster";

const token = process.env.GITHUB_TOKEN;
const anthropicKey = process.env.ANTHROPIC_API_KEY;
const daytonaKey = process.env.DAYTONA_API_KEY;

if (!token) throw new Error("GITHUB_TOKEN is required");
if (!anthropicKey) throw new Error("ANTHROPIC_API_KEY is required");
if (!daytonaKey) throw new Error("DAYTONA_API_KEY is required");

// Test config - change these to test against different repos
const owner = "kernl-sdk";
const repo = "kernl";
const repoUrl = `https://github.com/${owner}/${repo}.git`;

async function getLatestCommitDiff(
  octokit: Octokit,
  owner: string,
  repo: string,
): Promise<{ sha: string; diff: string }> {
  const { data: commits } = await octokit.repos.listCommits({
    owner,
    repo,
    per_page: 1,
  });
  const sha = commits[0].sha;

  const { data } = await octokit.repos.getCommit({
    owner,
    repo,
    ref: sha,
    mediaType: { format: "diff" },
  });

  return { sha, diff: data as unknown as string };
}

async function main() {
  console.log(`Testing Docster against ${owner}/${repo}`);
  console.log("---\n");

  const kernl = new Kernl();
  kernl.register(triager);
  kernl.register(docster);

  const octokit = new Octokit({ auth: token });

  // Stage 1: Triage
  console.log("Stage 1: Fetching latest commit and analyzing...\n");

  const { sha, diff } = await getLatestCommitDiff(octokit, owner, repo);
  console.log(`Commit: ${sha.slice(0, 7)}`);
  console.log(`Diff size: ${diff.length} chars\n`);

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

  console.log("Running triager...\n");

  const res = await triager.run(tinstr, {
    context: { owner, repo },
  });

  const triage = res.response;
  if (!triage) {
    throw new Error("Triager did not return a response");
  }

  console.log(
    `\nTriage: ${triage.needs_updating ? "NEEDS UPDATE" : "NO UPDATE NEEDED"}`,
  );
  console.log(`Reason: ${triage.reason}\n`);

  if (!triage.needs_updating) {
    console.log("---");
    console.log("Done (no docs update needed)");
    return;
  }

  // Stage 2: Docster
  console.log("Stage 2: Running Docster...\n");

  const dinstr = `
Repository: ${repoUrl}
Owner: ${owner}
Repo: ${repo}
Commit SHA: ${sha.slice(0, 7)}

Triage reason: ${triage.reason}

Clone the repository, analyze the recent changes, and update any documentation that needs to reflect those changes. Create a pull request with your updates.
`;

  const docsterStream = docster.stream(dinstr, {
    context: {
      git: { username: "x-access-token", token: token! },
      owner,
      repo,
    },
  });

  for await (const event of docsterStream) {
    if (event.kind === "tool-call") {
      console.log(`[docster:tool] ${event.toolId}(${event.arguments})`);
    } else if (event.kind === "tool-result") {
      const result = JSON.stringify(event.result ?? "").slice(0, 200);
      console.log(`[docster:result] ${result}`);
    } else if (event.kind === "text-delta") {
      process.stdout.write(event.text);
    }
  }

  console.log("\n---");
  console.log("Done");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
