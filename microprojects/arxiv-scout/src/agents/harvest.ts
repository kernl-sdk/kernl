import { z } from "zod";
import { Agent } from "kernl";
import { anthropic } from "@kernl-sdk/ai/anthropic";

import { criteria } from "@/lib/criteria";
import { KERNL_CONTEXT } from "@/lib/context";

const PaperRelevance = z.object({
  id: z.string().describe("The arXiv paper ID"),
  score: z.number().describe("Relevance score from 0.0 to 1.0"),
  topic: z.string().describe("Primary relevant topic (e.g., 'Memory Systems')"),
  reason: z
    .string()
    .describe(
      "Why this paper is relevant AND what's novel vs. what kernl already does",
    ),
});

const HarvestOutput = z.object({
  papers: z
    .array(PaperRelevance)
    .describe("Papers with relevance score >= 0.7"),
  summary: z.string().describe("Brief summary of what was found today"),
});

export type HarvestResult = z.infer<typeof HarvestOutput>;
export type PaperRelevanceResult = z.infer<typeof PaperRelevance>;

export const harvester = new Agent({
  id: "harvester",
  name: "Harvester",
  model: anthropic("claude-opus-4-5"),
  instructions: `
You are a research paper filter for kernl.

${KERNL_CONTEXT}

${criteria()}

## Your Task

Filter arXiv papers for genuine relevance to kernl. You must understand what kernl ALREADY DOES to avoid flagging papers that cover solved problems.

For each paper:

1. Read the title and abstract carefully
2. Ask: Does this address something kernl doesn't already handle?
3. Ask: Is this genuinely novel, or is it standard practice we've already implemented?
4. Assign a relevance score (0.0 to 1.0)

## Scoring Guidelines

**Score 0.9-1.0**: Novel technique we haven't considered. Could change how we build kernl.
**Score 0.7-0.8**: Addresses something on our roadmap, or improves on what we have.
**Score 0.5-0.6**: Interesting but kernl already handles this adequately.
**Score 0.0-0.4**: Not relevant, or kernl's approach is already superior.

## What to EXCLUDE (even if it sounds relevant):

- Basic agent architectures — kernl already has Agent, toolkits, structured output
- Simple memory/RAG papers — kernl has three-tier memory with semantic search
- Thread/session management — kernl has automatic thread persistence
- Tool calling basics — kernl has Toolkit and MCPToolkit
- Provider abstraction — kernl is already provider-agnostic
- Basic tracing/logging — kernl has Tokio-inspired tracing

## What to INCLUDE:

- Novel multi-agent coordination (v1.0 roadmap)
- Memory architectures that go beyond our three-tier model
- New approaches to tool use, sandboxing, or verification
- Realtime/streaming innovations
- Observability techniques we haven't considered
- Task scheduling and dependency management (v0.5 roadmap)

## Output

Only include papers scoring >= 0.7. In the reason field, explain:
1. What the paper contributes
2. Why it's novel for kernl (what we don't already do)
`,
  output: HarvestOutput,
});
