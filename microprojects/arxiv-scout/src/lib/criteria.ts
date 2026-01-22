/**
 * Relevance criteria for filtering arXiv papers.
 *
 * These define what makes a paper interesting for kernl development.
 */

export const TRACKS = {
  ai: {
    name: "AI & Agents",
    categories: ["cs.AI", "cs.LG", "cs.CL", "cs.MA", "cs.SE", "cs.CE"],
    description: "Agent architectures, memory, reasoning, multi-agent coordination",
  },
  infra: {
    name: "Infrastructure",
    categories: ["cs.DC"],
    description: "Distributed systems, scheduling, orchestration for managed runtimes",
  },
} as const;

export type Track = keyof typeof TRACKS;

export const CATEGORIES = [
  ...TRACKS.ai.categories,
  ...TRACKS.infra.categories,
] as const;

export const TOPICS = [
  {
    name: "Agent Architectures",
    keywords: ["agent", "reasoning loop", "tool calling", "function calling", "structured output", "ReAct", "chain-of-thought"],
    description: "How to structure AI agents, their control flow, and interaction patterns",
  },
  {
    name: "Memory Systems",
    keywords: ["memory", "long-term memory", "episodic memory", "working memory", "retrieval", "RAG", "context window"],
    description: "How agents remember, retrieve, and use past information",
  },
  {
    name: "Multi-Agent Coordination",
    keywords: ["multi-agent", "delegation", "handoff", "consensus", "collaboration", "orchestration", "swarm"],
    description: "How multiple agents work together, delegate tasks, and coordinate",
  },
  {
    name: "Tool Use & Protocols",
    keywords: ["tool use", "function calling", "MCP", "API", "sandbox", "code execution", "grounding"],
    description: "How agents interact with external tools, APIs, and environments",
  },
  {
    name: "Observability & Debugging",
    keywords: ["tracing", "debugging", "interpretability", "explainability", "logging", "monitoring"],
    description: "Understanding and debugging agent behavior and decisions",
  },
  {
    name: "Realtime & Streaming",
    keywords: ["realtime", "streaming", "voice", "audio", "live", "latency", "interactive"],
    description: "Real-time agent interactions, voice interfaces, and streaming",
  },
  {
    name: "Persistence & State",
    keywords: ["state", "persistence", "threads", "sessions", "checkpointing", "resumption"],
    description: "How agents maintain state across interactions",
  },
  {
    name: "Identity & Security",
    keywords: ["identity", "authentication", "authorization", "capability", "permission", "trust", "credential", "URI", "namespace"],
    description: "Agent identity, auth, capability-based security, and trust models",
  },
] as const;

export function criteria(): string {
  const topics = TOPICS.map(
    (t) => `- **${t.name}**: ${t.description}\n  Keywords: ${t.keywords.join(", ")}`
  ).join("\n\n");

  return `
## What is kernl?

kernl is a TypeScript framework for building AI agents that remember, reason, and act.
Key features: persistent threads, memory as a first-class citizen, provider agnostic, type-safe.

## Relevant Research Topics

${topics}

## Scoring

- **0.9-1.0**: Directly applicable. Could immediately inform implementation.
- **0.7-0.8**: Highly relevant. Could influence design decisions.
- **0.5-0.6**: Interesting but not immediately actionable.
- **0.0-0.4**: Not relevant to agent runtimes.

Only papers scoring **0.7+** should be included in the output.
`.trim();
}
