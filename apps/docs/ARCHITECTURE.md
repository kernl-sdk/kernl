# Kernl Architecture

A modern AI agent framework for building stateful, composable, and observable agents.

## Overview

Kernl is a TypeScript monorepo that provides a complete toolkit for building AI agents. The architecture is designed around three core principles:

1. **Provider Agnostic** - The protocol layer is independent of any specific LLM provider
2. **Event Sourced** - Threads are immutable event logs, enabling replay and recovery
3. **Composable** - Tools, memory, and storage are pluggable abstractions

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Core SDK                                    │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                         kernl                                │   │
│   │  ┌───────┐ ┌────────┐ ┌──────┐ ┌────────┐ ┌───────────────┐ │   │
│   │  │ agent │ │ thread │ │ tool │ │ memory │ │ mcp/realtime  │ │   │
│   │  └───────┘ └────────┘ └──────┘ └────────┘ └───────────────┘ │   │
│   └─────────────────────────────────────────────────────────────┘   │
│   ┌───────────┐  ┌───────────┐  ┌────────────┐                      │
│   │ protocol  │  │ retrieval │  │   shared   │                      │
│   └───────────┘  └───────────┘  └────────────┘                      │
├─────────────────────────────────────────────────────────────────────┤
│                         Providers                                    │
│   ┌────────┐  ┌────────┐  ┌────────┐  ┌────────────┐               │
│   │   ai   │  │ openai │  │  xai   │  │ elevenlabs │               │
│   └────────┘  └────────┘  └────────┘  └────────────┘               │
├─────────────────────────────────────────────────────────────────────┤
│                          Storage                                     │
│   ┌─────────┐  ┌────────┐  ┌────────┐  ┌─────────────┐             │
│   │ storage │  │   pg   │  │ libsql │  │ turbopuffer │             │
│   └─────────┘  └────────┘  └────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
```

## Repository Structure

```
kernl/
├── packages/           # Core SDK packages
│   ├── kernl/          # Main agent framework
│   ├── protocol/       # LLM protocol definitions
│   ├── retrieval/      # Embedding & vector search
│   ├── shared/         # Common utilities
│   ├── react/          # React bindings
│   ├── server/         # Dev server (experimental)
│   ├── cli/            # CLI tool
│   ├── create-kernl/   # Project scaffolding
│   ├── providers/      # LLM provider adapters
│   │   ├── ai/         # Vercel AI SDK adapter
│   │   ├── openai/     # OpenAI realtime
│   │   └── xai/        # xAI (Grok) realtime
│   └── storage/        # Storage implementations
│       ├── storage/    # Abstract interfaces
│       ├── pg/         # PostgreSQL
│       ├── libsql/     # LibSQL/SQLite
│       └── turbopuffer/# Vector search
├── apps/               # Public applications
│   ├── docs/           # Documentation site
│   ├── landing/        # Marketing site
│   ├── registry/       # Tool registry
│   └── popcorn/        # AI dev platform
├── microprojects/      # Production examples
│   ├── jarvis/         # Planning assistant
│   ├── watson/         # Voice agent
│   └── docster/        # Doc auto-updater
└── .notes/             # Internal knowledge base
```

## Core Concepts

### Thread (Event Log State Machine)

The Thread is the execution core of Kernl. It implements an event-sourced state machine where the event log is the source of truth.

```
┌──────────────────────────────────────────────────────────────┐
│                         Thread                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                     Event Log                           │  │
│  │  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐          │  │
│  │  │ E1  │→ │ E2  │→ │ E3  │→ │ E4  │→ │ E5  │→  ...    │  │
│  │  └─────┘  └─────┘  └─────┘  └─────┘  └─────┘          │  │
│  └────────────────────────────────────────────────────────┘  │
│                              │                                │
│                              ▼                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                   State Projection                      │  │
│  │   messages[], tools[], context, status                  │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

Key properties:
- **Monotonic sequence** - Events are append-only, no gaps
- **Single-writer** - One executor per thread at a time
- **Replay recovery** - Can rebuild state from event log
- **Atomic transactions** - Events buffered within tick, persisted atomically

### Agent

Agents are the primary abstraction for building AI assistants. Two types exist:

**Agent** - Standard LLM-based agent with tool calling
```ts
const agent = new Agent({
  id: 'assistant',
  name: 'My Assistant',
  model: 'claude-sonnet-4-20250514',
  instructions: 'You are a helpful assistant.',
  toolkits: [myToolkit],
  memory: { enabled: true }
});
```

**RealtimeAgent** - WebSocket or WebRTC-based voice agent
```ts
const agent = new RealtimeAgent({
  id: 'voice',
  provider: openai.realtime('gpt-4o-realtime'),
  instructions: 'You are a voice assistant.',
});
```

### Tool System

Tools are composable and support both static functions and dynamic MCP servers.

```
┌─────────────────────────────────────────────────────────────┐
│                      Tool System                             │
│                                                              │
│  ┌───────────────────┐    ┌───────────────────────────────┐ │
│  │  FunctionToolkit  │    │         MCPToolkit            │ │
│  │  ┌─────┐ ┌─────┐  │    │  ┌─────────────────────────┐  │ │
│  │  │tool1│ │tool2│  │    │  │    MCP Server (stdio)   │  │ │
│  │  └─────┘ └─────┘  │    │  └─────────────────────────┘  │ │
│  └───────────────────┘    │  ┌─────────────────────────┐  │ │
│                           │  │    MCP Server (SSE)     │  │ │
│                           │  └─────────────────────────┘  │ │
│                           └───────────────────────────────┘ │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   System Tools                         │  │
│  │          (built-in memory tool, etc.)                  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**FunctionToolkit** - Static TypeScript functions with Zod schemas
```ts
const toolkit = new FunctionToolkit({
  name: 'calculator',
  tools: {
    add: {
      description: 'Add two numbers',
      parameters: z.object({ a: z.number(), b: z.number() }),
      execute: async ({ a, b }) => a + b
    }
  }
});
```

**MCPToolkit** - Dynamic tools from MCP servers
```ts
const toolkit = new MCPToolkit({
  name: 'filesystem',
  transport: new StdioTransport({
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp']
  })
});
```

### Memory System

Multi-layered memory with automatic embedding and retrieval.

```
┌─────────────────────────────────────────────────────────────┐
│                      Memory Layers                           │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Working Memory (Active Context)           │  │
│  │         Current conversation, active variables         │  │
│  └───────────────────────────────────────────────────────┘  │
│                            │                                 │
│                            ▼                                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           Short-Term Memory (Recent History)           │  │
│  │              Recent interactions, cached                │  │
│  └───────────────────────────────────────────────────────┘  │
│                            │                                 │
│                            ▼                                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │             Archive (Vector-Indexed History)           │  │
│  │         Full history with semantic search               │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

Memory supports pluggable codecs for serialization:
- **Identity** - Pass-through (default)
- **Domain** - Custom domain transformations
- **Turbopuffer** - Vector database integration

### Storage Abstraction

Storage is abstracted to support multiple backends.

| Interface | Purpose | Implementations |
|-----------|---------|-----------------|
| `ThreadStore` | Event log persistence | In-memory, PostgreSQL, LibSQL |
| `MemoryStore` | Memory record persistence | In-memory, PostgreSQL, LibSQL |
| `VectorIndex` | Semantic search | In-memory, Turbopuffer |

## Package Dependencies

```
                    ┌─────────┐
                    │ shared  │  (no dependencies)
                    └────┬────┘
                         │
              ┌──────────┼──────────┐
              │          │          │
              ▼          ▼          ▼
        ┌──────────┐ ┌──────────┐
        │ protocol │ │retrieval │
        └────┬─────┘ └────┬─────┘
             │            │
             └──────┬─────┘
                    │
                    ▼
              ┌──────────┐
              │  kernl   │  (main framework)
              └────┬─────┘
                   │
     ┌─────────────┼─────────────┐
     │             │             │
     ▼             ▼             ▼
┌─────────┐  ┌──────────┐  ┌─────────┐
│providers│  │ storage  │  │  react  │
└─────────┘  └──────────┘  └─────────┘
```

## Build System

- **Package Manager**: pnpm 10.28.0 with workspace catalog
- **Task Runner**: Turbo for parallel builds
- **TypeScript**: 5.9.2, ES2022 target, bundler resolution
- **Testing**: Vitest for unit tests

### Key Commands

```bash
pnpm build        # Build all packages
pnpm dev          # Watch mode
pnpm lint         # ESLint
pnpm check-types  # TypeScript validation
pnpm format       # Prettier
```

### Package Build

Each package uses `tsc + tsc-alias` for compilation:
```bash
tsc && tsc-alias --resolve-full-paths
```

Output goes to `dist/` with ES modules and declaration files.

## Applications

### docs (`apps/docs`)
Documentation site built with Next.js + Nextra. Deployed to docs.kernl.sh.

### landing (`apps/landing`)
Marketing site with Next.js + Velite for static content.

### registry (`apps/registry`)
Searchable registry of available toolkits and integrations.

### popcorn (`apps/popcorn`)
AI-powered development platform (under active development). Contains:
- `sdk/` - TypeScript client SDK
- `server0/` - Hono backend
- `web/` - Next.js frontend
- `cli/` - Command-line interface
- `tui/` - Terminal UI (SolidJS)

## Microprojects

Production-ready examples demonstrating Kernl capabilities:

### jarvis
Chief of Staff agent for engineering teams. Queries Linear and GitHub to synthesize planning information.

### watson
Voice assistant with persistent memory. Uses OpenAI Realtime API with PostgreSQL + Turbopuffer storage.

### docster
GitHub Action that automatically updates documentation when code changes. Uses two-stage processing (Sonnet triage, Opus writing).

## Testing

Tests use Vitest with the `describe/it/expect` pattern.

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests once
pnpm test:run
```

Test files are located at `**/__tests__/*.test.ts` within packages.

Key test areas:
- Thread event log behavior and persistence
- Agent tool calling and concurrency
- MCP transport integration (stdio, SSE)
- Memory codec transformations
- Storage adapter correctness

## Configuration Files

| File | Purpose |
|------|---------|
| `turbo.json` | Task definitions and caching |
| `pnpm-workspace.yaml` | Workspace packages and version catalog |
| `tsconfig.base.json` | Shared TypeScript config |
| `.changeset/` | Version management |

## Getting Started

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Build all packages: `pnpm build`
4. Run tests: `pnpm test`

For creating a new project:
```bash
npm create kernl@latest
```
