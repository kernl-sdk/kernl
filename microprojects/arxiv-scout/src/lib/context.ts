/**
 * Kernl context for the analyst agent.
 * This gives the analyst deep knowledge of kernl to compare papers against.
 */

export const KERNL_CONTEXT = `
# kernl — What You Need to Know

kernl is a TypeScript framework for building AI agents that remember, reason, and act.
You are analyzing research papers to determine what's novel vs. what kernl already does.

## Core Philosophy

- **Memory is first-class** — Not an afterthought. Agents have working memory, short-term, and long-term memory with semantic search.
- **Provider agnostic** — No vendor lock-in. Swap models per-agent or per-request (OpenAI, Anthropic, Google, x.ai).
- **Thread-based persistence** — Conversations persist automatically. Create, resume, query threads without custom infrastructure.
- **Type-safe** — Full TypeScript support throughout. Zod schemas for structured output.

## What kernl Already Has (Implemented)

### Agents
- Agent class with instructions, model, tools, memory config
- Blocking \`run()\` and streaming \`stream()\` execution
- Structured output via Zod schemas
- Context injection (user info, session state, feature flags)

### Threads
- Automatic conversation persistence
- Thread creation, resumption, querying
- Namespaces for multi-tenancy
- Message history management

### Memory
- Three-tier: working memory, short-term, long-term
- Semantic search over memories
- Manual and autonomous memory operations
- Pluggable storage backends (PostgreSQL, LibSQL, Turbopuffer)

### Toolkits
- Standard Toolkit for TypeScript functions
- MCPToolkit for Model Context Protocol servers
- Tool composition and filtering
- Context-aware tool execution

### Realtime/Voice
- Provider-agnostic realtime support (only framework with this)
- RealtimeAgent and RealtimeSession classes
- Audio streaming, voice activity detection
- Works with OpenAI Realtime, Google, etc.

### Observability
- Tokio-inspired tracing system with spans
- Structured logging via Pino
- OpenTelemetry integration
- Per-run traces with cost estimates

### MCP Integration
- Connect MCP servers via stdio, HTTP, SSE
- Resource listing, reading, subscribing
- Tool discovery from MCP servers

## Roadmap (Planned, Not Yet Implemented)

- **v0.5 Tasks & Scheduling** — Task graphs with dependencies, retries, deadlines
- **v0.6 Resources & Artifacts** — MCP-compatible artifact management, versioning
- **v0.7 Middleware & Auth** — Auth middleware, capability gating, guardrails
- **v0.8 Events & Channels** — Slack/Gmail adapters, event-driven runs
- **v1.0 Multi-agent** — Agent-to-agent tasking, sandboxed tools, concurrency

## Design Decisions (Why We Chose What We Chose)

1. **Threads over sessions** — We chose explicit thread management over implicit sessions because agents need to resume conversations across requests, not just within a single session.

2. **Memory tiers** — Three-tier memory (working/short/long) mirrors human cognition. Working memory is ephemeral (current run), short-term persists across runs, long-term is searchable knowledge.

3. **Provider adapters, not abstractions** — We wrap providers directly rather than creating a unified "LLM" interface. Each provider has unique capabilities (realtime, vision, etc.) that shouldn't be lowest-common-denominator'd.

4. **Toolkits, not raw tools** — Tools are grouped into Toolkits for organization, shared context, and lifecycle management. An agent doesn't have "tools", it has "toolkits".

5. **MCP-first for integrations** — Rather than building custom integrations, we embrace MCP as the protocol. MCPToolkit connects to any MCP server.

6. **Tracing inspired by Tokio** — We adopted Tokio's span-based tracing model because it handles async context propagation well, which is critical for streaming agent execution.

## When Analyzing Papers

Ask yourself:
1. **Does kernl already do this?** — Check the "What kernl Already Has" section
2. **Is this on the roadmap?** — Check "Roadmap" for planned features
3. **Does this contradict our design decisions?** — If so, explain why kernl chose differently
4. **Is this genuinely novel?** — New technique we haven't considered?
5. **Should we adopt this?** — Concrete recommendation with tradeoffs
`.trim();
