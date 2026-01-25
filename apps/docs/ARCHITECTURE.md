# Kernl Architecture

Kernl is a TypeScript framework for building and coordinating AI agents that remember, reason, and act. This document describes the monorepo structure, core modules, and design patterns.

## Repository Structure

```
kernl/
├── packages/           # Core SDK packages (published to npm)
│   ├── kernl/          # Core framework - agents, threads, memory, toolkits
│   ├── protocol/       # Type definitions and interfaces for models
│   ├── cli/            # CLI tool and project scaffolding
│   ├── create-kernl/   # npm init wrapper
│   ├── server/         # Hono-based HTTP server for agents
│   ├── react/          # React hooks and components for realtime UIs
│   ├── retrieval/      # Vector search abstraction layer
│   ├── shared/         # Common utilities, emitters, codecs
│   ├── providers/      # AI provider implementations
│   │   ├── ai/         # Vercel AI SDK adapter (Anthropic, OpenAI, Google)
│   │   ├── openai/     # OpenAI realtime voice
│   │   └── xai/        # xAI Grok realtime voice
│   └── storage/        # Storage adapters (postgres, etc.)
├── apps/               # Internal applications
│   ├── docs/           # Documentation site (Fumadocs + Next.js)
│   ├── landing/        # Marketing site (Next.js + Velite)
│   ├── popcorn/        # Multi-platform AI IDE (SolidJS + Hono)
│   └── registry/       # Toolkit registry system
└── microprojects/      # Example applications
    ├── playground/     # Interactive agent development environment
    ├── charger/        # Coding assistant with sandbox execution
    ├── docster/        # Automated documentation sync (GitHub Action)
    └── watson/         # Customer discovery analysis platform
```

## Core Packages

### kernl (Core Framework)

The heart of the SDK. Provides the runtime for defining, registering, and executing AI agents.

**Key Concepts:**

| Concept | Description |
|---------|-------------|
| `Kernl` | Central orchestrator - manages agent registry, storage, memory system, tracing |
| `Agent` | LLM-based agent with instructions, model, toolkits, and optional memory |
| `RealtimeAgent` | Voice/realtime agent for bidirectional audio sessions |
| `Thread` | Execution context with event-sourced state (immutable event log) |
| `Toolkit` | Collection of tools an agent can invoke |
| `Memory` | Three-layer cognitive storage (working, short-term, long-term) |

**Agent Definition:**

```typescript
const agent = new Agent({
  id: "jarvis",
  name: "Jarvis",
  instructions: "You are a helpful assistant.",
  model: anthropic("claude-sonnet-4-5"),
  toolkits: [math, github],
  memory: { enabled: true },
});

const kernl = new Kernl({ storage, memory });
kernl.register(agent);

const result = await agent.run("What is 2 + 2?");
```

**Thread Execution Model:**

Threads follow event-sourcing principles:
- Event log is the source of truth
- Single writer per thread prevents races
- Storage is authoritative (persist before use)
- Recovery via replay from event log

**Memory Architecture:**

| Layer | Name | Purpose |
|-------|------|---------|
| L1 | Working Memory | Active context exposed to model in real-time |
| L2 | Short-Term Memory | Bounded recent context with TTL |
| L3 | Long-Term Memory | Durable, structured store with semantic search |

### protocol

Defines the standard interfaces that all AI model providers implement.

**Core Interfaces:**

```typescript
interface LanguageModel {
  readonly spec: "1.0";
  readonly provider: string;
  readonly modelId: string;
  generate(request: LanguageModelRequest): Promise<LanguageModelResponse>;
  stream(request: LanguageModelRequest): AsyncIterable<LanguageModelStreamEvent>;
}

interface EmbeddingModel<TValue = string> {
  embed(request: EmbeddingModelRequest<TValue>): Promise<EmbeddingModelResponse>;
}

interface RealtimeModel {
  connect(options?: RealtimeConnectOptions): Promise<RealtimeConnection>;
  authenticate(options?: RealtimeAuthenticateOptions): Promise<ClientCredential>;
}
```

**Message Types:**

- `SystemMessage` - System instructions
- `UserMessage` - User input (text, files, data parts)
- `AssistantMessage` - Model responses
- `ToolCall` / `ToolResult` - Tool invocation and results
- `Reasoning` - Model reasoning (for reasoning models)

**Thread States** (Unix-inspired):

| State | Description |
|-------|-------------|
| `running` | Currently executing |
| `interruptible` | Blocked, can be interrupted |
| `uninterruptible` | Blocked, cannot be interrupted |
| `stopped` | Explicitly paused |
| `zombie` | Finished, waiting for cleanup |
| `dead` | Being removed |

### retrieval

Vendor-agnostic vector search abstraction supporting multiple backends.

**Supported Operations:**

```typescript
interface SearchIndex {
  createIndex(config: IndexConfig): Promise<IndexHandle>;
  bindIndex(id: string): Promise<IndexHandle>;
  listIndexes(): Promise<IndexDescriptor[]>;
  deleteIndex(id: string): Promise<void>;
}

interface IndexHandle<TDocument> {
  upsert(documents: TDocument[]): Promise<void>;
  patch(id: string, fields: Partial<TDocument>): Promise<void>;
  delete(ids: string[]): Promise<void>;
  query(input: QueryInput): Promise<SearchHit<TDocument>[]>;
}
```

**Query Planning:**

The retrieval package includes intelligent query planning that adapts queries based on backend capabilities:
- Hybrid search (text + vector) with graceful degradation
- Multi-signal ranking with fusion
- MongoDB-style filter operators

### server

Hono-based HTTP server exposing agents as REST APIs.

**Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/agents` | List registered agents |
| POST | `/agents/:id/stream` | Execute agent with SSE streaming |
| GET | `/threads` | List threads (cursor pagination) |
| POST | `/threads` | Create new thread |
| GET | `/threads/:tid/messages` | Get thread history |
| POST | `/threads/:tid/stream` | Stream to existing thread |
| POST | `/realtime/credential` | Get ephemeral realtime credentials |

### react

React hooks and components for building realtime AI interfaces.

**Exports:**

| Export | Description |
|--------|-------------|
| `useRealtime` | Hook for managing realtime voice sessions |
| `useBrowserAudio` | Hook for browser audio resources |
| `LiveWaveform` | Canvas-based audio visualization component |
| `BrowserChannel` | Low-level Web Audio I/O with 24kHz PCM16 wire format |

### providers

AI provider implementations adapting vendor SDKs to the protocol interfaces.

**Text-Based Providers** (via `@kernl-sdk/ai`):

```typescript
import { anthropic } from "@kernl-sdk/ai/anthropic";
import { openai } from "@kernl-sdk/ai/openai";
import { google } from "@kernl-sdk/ai/google";

const model = anthropic("claude-sonnet-4-5");
```

Built on Vercel AI SDK v5 with codec converters for messages, tools, settings, and streaming.

**Realtime Voice Providers:**

```typescript
import { openai } from "@kernl-sdk/openai";
import { xai } from "@kernl-sdk/xai";

const model = openai.realtime("gpt-4o-realtime-preview");
```

WebSocket-based connections with ephemeral token authentication.

### shared

Foundational utilities used across all packages.

| Module | Description |
|--------|-------------|
| `Emitter` | Type-safe event emitter |
| `Codec` | Bidirectional transformation with Zod validation |
| `CursorPage` / `OffsetPage` | Pagination abstractions (AsyncIterable) |
| Error types | `ValidationError`, `NotFoundError`, `ConflictError` |
| Utils | `randomID()`, `timeISO()`, `filter()` (async) |

### cli

Command-line interface for project scaffolding and toolkit management.

**Commands:**

```bash
kernl init [name]           # Create new kernl project
kernl add toolkit <names>   # Add toolkits from registry
```

**Generated Project Structure:**

```
my-app/
├── src/
│   ├── agents/jarvis.ts    # Pre-configured agent
│   ├── toolkits/           # Example toolkits
│   └── index.ts            # Entry point
├── kernl.json              # Config file
├── package.json
└── .env                    # API keys
```

## Applications

### docs

Fumadocs-based documentation site at docs.kernl.sh.

### landing

Next.js marketing site with Velite for static content.

### popcorn

Multi-platform AI IDE with:
- **web/** - SolidJS web UI
- **cli/** - Command-line interface
- **server0/** - Hono backend
- **tui/** - Terminal UI (OpenTUI)
- **sdk/** - Shared SDK
- **ui/** - Component library

### registry

Toolkit registry system. Builds toolkit JSON definitions for `kernl add toolkit`.

## Design Patterns

### Event Sourcing (Threads)

Threads maintain an append-only event log as the source of truth. State is derived by replaying events. This enables:
- Reliable recovery from failures
- Audit trails for debugging
- Time-travel debugging

### Registry Pattern

`AgentRegistry` and `ModelRegistry` provide runtime lookup of registered entities:

```typescript
kernl.register(agent);
const agent = kernl.agents.get("jarvis");
```

### Codec Pattern

Bidirectional transformations with type safety:

```typescript
const codec: Codec<KernlFormat, ProviderFormat> = {
  encode(value) { /* kernl -> provider */ },
  decode(value) { /* provider -> kernl */ }
};
```

### Toolkit Composition

Toolkits aggregate tools and can be:
- **Static** (`FunctionToolkit`) - In-memory tool registry
- **Dynamic** (`MCPToolkit`) - Lazy-loaded from MCP servers

```typescript
const math = new Toolkit({
  id: "math",
  tools: [add, subtract, multiply, divide],
});
```

### Capability-Based Query Planning

The retrieval layer inspects backend capabilities and adapts queries:

```typescript
const planned = planQuery(query, capabilities);
if (planned.degraded) {
  console.warn(planned.warnings);
}
```

### Tracing (Tokio-Inspired)

Hierarchical span-based observability:

```typescript
const kernl = new Kernl({
  tracer: new ConsoleSubscriber(),
});
```

Event types: `thread.start`, `thread.stop`, `model.call.start`, `model.call.end`, `tool.call.start`, `tool.call.end`

## Data Flow

```
User Request
    │
    ▼
┌─────────────────┐
│     Kernl       │  ← Orchestrator
└────────┬────────┘
         │
    ▼ register
┌─────────────────┐
│     Agent       │  ← Definition (instructions, model, toolkits)
└────────┬────────┘
         │
    ▼ run/stream
┌─────────────────┐
│     Thread      │  ← Execution context (event log, state)
└────────┬────────┘
         │
    ▼ generate/stream
┌─────────────────┐
│  LanguageModel  │  ← Provider abstraction
└────────┬────────┘
         │
    ▼ tool calls
┌─────────────────┐
│    Toolkits     │  ← Tool execution
└────────┬────────┘
         │
    ▼ persist
┌─────────────────┐
│    Storage      │  ← Thread events, memories, vectors
└─────────────────┘
```

## Storage Architecture

```typescript
interface KernlStorage {
  threads: ThreadStore;     // Thread event logs
  memories: MemoryStore;    // Memory records
  bind(registries): void;   // Wire up lookups
  transaction(fn): Promise; // ACID transactions
  init(): Promise;          // Connect + schema
  close(): Promise;         // Cleanup
  migrate(): Promise;       // Run migrations
}
```

Implementations:
- `InMemoryStorage` - Development/testing
- PostgreSQL adapters - Production with pgvector

## Memory System

```typescript
agent.memories.create("User prefers dark mode", "preferences");
agent.memories.search("What are the user's preferences?");
```

Memory features:
- Multimodal content (text, image, audio, video, structured objects)
- Semantic search with embeddings
- Metadata tagging and filtering
- Vector indexing (pgvector, Turbopuffer)

## Realtime Architecture

```
┌──────────────────┐     WebSocket      ┌──────────────────┐
│   Browser        │◄──────────────────►│   Realtime API   │
│                  │                    │   (OpenAI/xAI)   │
│  BrowserChannel  │                    └──────────────────┘
│  - Mic capture   │
│  - Audio playback│
│  - 24kHz PCM16   │
└──────────────────┘

Client Events: session.update, audio.input.append, response.create
Server Events: audio.output.delta, transcript.output, tool.call
```

## Build System

- **Package Manager:** pnpm (workspace protocol)
- **Build Orchestration:** Turborepo
- **TypeScript:** 5.9.x with path aliases
- **Testing:** Vitest
- **Bundling:** tsup (CLI), tsc (libraries)

```bash
pnpm build        # Build all packages
pnpm dev          # Development mode
pnpm check-types  # Type checking
```

## Contributing

1. Packages export through `src/index.ts`
2. Use `@kernl-sdk/protocol` types for cross-package contracts
3. Prefer composition over inheritance
4. Write tests with Vitest
5. Follow existing patterns in similar code
