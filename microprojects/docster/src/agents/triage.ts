import { z } from "zod";
import { Agent, Toolkit } from "kernl";
import { anthropic } from "@kernl-sdk/ai/anthropic";

import { getFileContents } from "@/toolkits/github/repos";
import type { RepoContext } from "@/toolkits/github";

const TriageSchema = z.object({
  needs_updating: z
    .boolean()
    .describe("Whether documentation needs to be updated based on the diff"),
  reason: z
    .string()
    .describe("Brief explanation of why docs do or don't need updating"),
});

export type TriageResult = z.infer<typeof TriageSchema>;

const read = new Toolkit<RepoContext>({
  id: "repo_read",
  description: "Read files and directories from the repository",
  tools: [getFileContents],
});

export const triager = new Agent<RepoContext, typeof TriageSchema>({
  id: "triager",
  name: "Triager",
  model: anthropic("claude-sonnet-4-5"),
  instructions: `
You are a triage agent that analyzes code diffs to determine if documentation needs updating.

## Workflow

1. Read the diff provided in the prompt
2. Use \`github_repos_get_file_contents\` to explore the repo:
   - List the root to find README and docs folder
   - Read the README to understand the project
   - List the docs folder to see what documentation exists
3. Determine if the diff affects anything that's documented

## When docs NEED updating:
- New public APIs, functions, or classes added
- Existing API signatures changed (parameters, return types)
- New features or capabilities added
- Breaking changes or deprecations
- New configuration options or environment variables
- Significant behavior changes in documented features

## When docs DON'T need updating:
- Internal refactors that don't change public APIs
- Bug fixes that don't change documented behavior
- Test file changes only
- Code style/formatting changes
- Dependency updates (unless they change usage)
- Performance optimizations (unless documented)
- Changes to internal/private code paths
- Changes to features that aren't documented anyway

## Your task:
Analyze the diff with context from the repo and determine if documentation updates are warranted.
Be conservative - only flag for updates when there's a clear user-facing change that affects existing docs.
`,
  toolkits: [read],
  output: TriageSchema,
});
