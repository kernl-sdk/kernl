# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Kernl is an AI agent framework with multi-provider support, memory, realtime/voice capabilities, and tool orchestration. Built with TypeScript in a pnpm monorepo using Turborepo.

## Project Structure

```
packages/
├── kernl/           # Core runtime (main package, published as 'kernl')
├── protocol/        # Provider-agnostic interfaces (@kernl-sdk/protocol)
├── providers/
│   ├── ai/          # AI SDK adapter for text models (@kernl-sdk/ai)
│   ├── openai/      # OpenAI realtime provider (@kernl-sdk/openai)
│   └── xai/         # xAI/Grok realtime provider (@kernl-sdk/xai)
├── storage/
│   ├── core/        # Storage abstractions (@kernl-sdk/storage)
│   ├── libsql/      # LibSQL implementation
│   ├── pg/          # PostgreSQL implementation
│   └── turbopuffer/ # Turbopuffer vector store
├── retrieval/       # Search/vector abstractions (@kernl-sdk/retrieval)
├── react/           # React bindings (@kernl-sdk/react)
├── server/          # Internal dev server (private)
├── shared/          # Shared utilities (@kernl-sdk/shared)
├── cli/             # CLI tool (@kernl-sdk/cli)
└── create-kernl/    # Create-kernl scaffolding

apps/
├── docs/            # Documentation site
├── landing/         # Landing page
└── registry/        # MCP toolkit registry

microprojects/       # Example applications (jarvis, watson, playground)
```

## Development Commands

```bash
# Build all packages
pnpm build

# Development mode (watch)
pnpm dev

# Lint / type check / format
pnpm lint
pnpm check-types
pnpm format

# Run tests in a package
cd packages/kernl && pnpm test       # watch mode
cd packages/kernl && pnpm test:run   # single run

# Run single test file
pnpm vitest src/path/to/test.test.ts

# Run playground
pnpm dev:playground
```

## Package Architecture

### Layer Separation

1. **Protocol Layer** (`@kernl-sdk/protocol`) - Standard interfaces
   - `LanguageModel`, `EmbeddingModel` interfaces
   - Request/Response types, stream events
   - Provider-agnostic tool definitions

2. **Provider Layer** - Implements protocol
   - `@kernl-sdk/ai` - AI SDK adapter for text models (anthropic, openai, google)
   - `@kernl-sdk/openai` - OpenAI realtime/voice
   - `@kernl-sdk/xai` - xAI/Grok realtime/voice

3. **Runtime Layer** (`kernl`) - Agent execution
   - Agent, Kernl, Context, Memory
   - Tool orchestration (FunctionToolkit, MCPToolkit)
   - Realtime agents and sessions

4. **Storage Layer** - Persistence
   - Core abstractions in `@kernl-sdk/storage`
   - Implementations: libsql, pg, turbopuffer

### Dependency Flow

```
kernl → protocol, retrieval, shared
providers/ai → protocol, retrieval, shared, @ai-sdk/*
providers/openai, xai → protocol, shared
storage/* → kernl, protocol, shared
react → kernl, protocol, shared
```

## Core Concepts

### Agent

Primary execution unit with model, instructions, toolkits, memory config.

```typescript
import { Agent, Kernl } from "kernl";
import { anthropic } from "@kernl-sdk/ai/anthropic";

const agent = new Agent({
  id: "my-agent",
  name: "My Agent",
  model: anthropic("claude-sonnet-4-5"),
  instructions: "You are a helpful assistant.",
  toolkits: [myToolkit],
  memory: { enabled: true },
});

const kernl = new Kernl();
kernl.register(agent);
const result = await agent.run("Hello");
```

### Realtime/Voice Agents

```typescript
import { RealtimeAgent, RealtimeSession } from "kernl";
import { openai } from "@kernl-sdk/openai";

const agent = new RealtimeAgent({
  id: "voice-agent",
  name: "Voice Agent",
  instructions: "Be concise.",
  toolkits: [myToolkit],
  memory: { enabled: true }
});

const session = new RealtimeSession(agent, {
  model: openai.realtime("gpt-realtime"),
});
```

### Memory System

Agents can have persistent memory with multi-modal support and semantic search.

**Memory Layers:**
- **Working Memory (L1/wmem)** - Active context pinned for immediate access
- **Short-Term Memory (L2/smem)** - Temporary with TTL expiration
- **Long-Term Memory (L3)** - Durable persistent storage

**Memory Types:**
- `episodic` - Events, experiences, conversations
- `semantic` - Facts, knowledge, learned information

**MemoryByte** - Content unit supporting multiple modalities:
```typescript
interface MemoryByte {
  text?: string;
  image?: { data: Uint8Array | string; mime: string };
  audio?: { data: Uint8Array | string; mime: string };
  video?: { data: Uint8Array | string; mime: string };
  object?: JSONObject;
}
```

**MemoryScope** - Ownership context:
```typescript
interface MemoryScope {
  namespace?: string;   // Logical grouping
  entityId?: string;    // External entity ID
  agentId?: string;     // Owning agent
}
```

**Agent Memory API:**
```typescript
// Create memory
await agent.memories.create({
  content: { text: "User prefers dark mode" },
  collection: "preferences",
  wmem: true  // pin to working memory
});

// Search memories
const results = await agent.memories.search({
  query: "user preferences",
  limit: 10
});

// List memories
const memories = await agent.memories.list({ collection: "preferences" });
```

**Kernl Memory Config:**
```typescript
const kernl = new Kernl({
  storage: { db: storage, vector: vectorIndex },
  memory: {
    embedding: "openai/text-embedding-3-small",
    dimensions: 1536,
    similarity: "cosine"
  }
});
```

### Tools

```typescript
import { tool } from "kernl";
import { z } from "zod";

const myTool = tool({
  id: "my_tool",
  name: "My Tool",
  description: "What it does",
  parameters: z.object({
    input: z.string().describe("Input description"),
  }),
  execute: async ({ context, parameters }) => {
    return { result: "success" };
  }
});
```

### MCP Integration

```typescript
import { MCPToolkit, MCPServerSSE } from "kernl";

const server = new MCPServerSSE({
  id: "my-mcp",
  url: "http://localhost:3001/sse",
});

const toolkit = new MCPToolkit({
  id: "mcp-tools",
  server,
});
```

## Import Aliases

All packages use `@` as alias for `src/`:
```typescript
import { Agent } from "@/agent";
```

## Conventions

- Use pnpm (v9.0.0+), Node.js >= 18
- Method names: linux style, lowercase short words
- Read `/docs/` specs before implementing
- Follow existing codebase patterns
- If spec is missing, propose addition first
- Changesets for version management (`.changeset/`)
