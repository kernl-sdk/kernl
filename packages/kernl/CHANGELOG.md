# @kernl/core

## 0.11.2

### Patch Changes

- 47e44c0: Fix lifecycle event architecture: Thread now owns all lifecycle events and emits via agent for uniform observability
  - Move thread.start/stop emissions from Kernl to Thread.stream()
  - Both agent.on() and kernl.on() now receive all lifecycle events
  - Remove redundant outcome field from ThreadStopEvent (use result/error instead)
  - Fix: schedule() was missing thread events, agent.on("thread.\*") never fired

## 0.11.1

### Patch Changes

- e1a7848: Export lifecycle event types from package root

## 0.11.0

### Minor Changes

- bb6ac60: Add lifecycle hooks for observing agent execution
  - New events: `thread.start`, `thread.stop`, `model.call.start`, `model.call.end`, `tool.call.start`, `tool.call.end`
  - Subscribe via `agent.on()` or `kernl.on()` for global hooks
  - Fixed error propagation in thread execution
  - Normalized `ErrorEvent.error` to always be an `Error` instance

### Patch Changes

- Updated dependencies [bb6ac60]
  - @kernl-sdk/protocol@0.4.1
  - @kernl-sdk/retrieval@0.1.7

## 0.10.0

### Minor Changes

- f593374: Add realtime voice agents with multi-provider support.
  - `RealtimeAgent` and `RealtimeSession` for voice-enabled AI agents
  - OpenAI GPT-4o realtime with WebSocket streaming
  - xAI Grok realtime with OpenAI-compatible protocol
  - React hooks: `useRealtime`, `useBrowserAudio`, `LiveWaveform`
  - Ephemeral credential pattern for secure browser connections
  - Tool execution with client-side context support

### Patch Changes

- Updated dependencies [f593374]
  - @kernl-sdk/protocol@0.4.0
  - @kernl-sdk/retrieval@0.1.6

## 0.9.1

### Patch Changes

- 25e46e7: Move zod to peerDependencies to prevent version conflicts

  Consumers should add `zod` as a direct dependency in their project. This ensures
  a single zod instance is used across all packages, avoiding type incompatibilities
  that could cause TypeScript to hang during type checking.

- Updated dependencies [25e46e7]
  - @kernl-sdk/shared@0.3.1
  - @kernl-sdk/protocol@0.3.1
  - @kernl-sdk/retrieval@0.1.5

## 0.9.0

### Minor Changes

- 572ae80: Add realtime voice agent support with memory capabilities.
  - **protocol**: Add realtime model and event types for voice agents
  - **kernl**: Extract BaseAgent class shared by Agent and RealtimeAgent, enabling memory support for realtime agents. Add `kind` discriminator for type narrowing.
  - **openai**: Add OpenAI realtime voice provider with WebSocket-based streaming

### Patch Changes

- Updated dependencies [572ae80]
  - @kernl-sdk/protocol@0.3.0
  - @kernl-sdk/retrieval@0.1.4

## 0.8.4

### Patch Changes

- e90b227: Make memory embedding opt-in with config warnings

## 0.8.3

### Patch Changes

- ae11e54: Replace pino logger with console-based implementation to reduce dependencies

## 0.8.2

### Patch Changes

- fix: handle postgres duplicate key error when index already exists
- fix: include object content and collection in memory search/list results

## 0.8.1

### Patch Changes

- 86fad68: Drop metadata from search index projection

  Metadata now lives only in the primary DB, not the search index. This fixes Turbopuffer serialization errors with nested objects and simplifies the index schema.

## 0.8.0

### Minor Changes

- 3fe8682: Add native structured output support for agents

  **kernl**
  - Add `output` field to Agent config (Zod schema for structured responses)
  - Rename type params: `TResponse` → `TOutput`, `AgentResponseType` → `AgentOutputType`
  - Wire `agent.output` through Thread to protocol's `responseType`

  **@kernl-sdk/ai**
  - Add `RESPONSE_FORMAT` codec for AI SDK's `responseFormat` parameter
  - Add structured output integration tests for OpenAI, Anthropic, and Google

## 0.7.4

### Patch Changes

- 6a6aa03: Add ObjectTextCodec for YAML-based object projection in memory indexing
  - Memory encoder now produces `objtext` field for FTS on structured objects
  - Embedding input combines text + objtext for richer semantic search
  - Fix domain codec to properly preserve user metadata (record.metadata)

## 0.7.3

### Patch Changes

- Updated dependencies [2b0993d]
  - @kernl-sdk/shared@0.3.0
  - @kernl-sdk/protocol@0.2.8
  - @kernl-sdk/retrieval@0.1.3

## 0.7.2

### Patch Changes

- Bump to pick up @kernl-sdk/shared with pagination types
- Updated dependencies
  - @kernl-sdk/protocol@0.2.7
  - @kernl-sdk/retrieval@0.1.2

## 0.7.1

### Patch Changes

- Updated dependencies
  - @kernl-sdk/shared@0.2.0
  - @kernl-sdk/protocol@0.2.6
  - @kernl-sdk/retrieval@0.1.1

## 0.7.0

### Minor Changes

- 13545a5: Add memory system tools and agents public API
  - Add system tools infrastructure (`agent.systools`) for built-in agent capabilities
  - Add memory toolkit with `memories.search`, `memories.create`, `memories.list` tools
  - Add `memory: { enabled: true }` agent config to enable memory tools
  - Add `ctx.agent` reference for tools to access agent APIs
  - Add `kernl.agents` public API with `get`, `list`, `has`, `unregister` methods
  - Add `Memory.list()` method for listing memories with filters
  - Add `agent.description` field for agent metadata
  - Fix: exclude metadata from thread checkpoint to prevent race conditions

## 0.6.3

### Patch Changes

- a7d6138: Add agent.memories API and memory integration with vector backends

  **@kernl-sdk/retrieval**
  - Add `planQuery()` for adapting queries based on backend capabilities
  - Add `SearchCapabilities` interface to describe backend features
  - Gracefully degrade hybrid queries when not supported

  **@kernl-sdk/pg**
  - Add `capabilities()` method to PGVectorSearchIndex
  - Fix hit decoding to include id in document

  **@kernl-sdk/turbopuffer**
  - Add `capabilities()` method describing supported search modes
  - Add bigint type mapping for timestamps
  - Fix hit decoding to include id in document
  - Add memory integration tests

  **kernl**
  - Add `agent.memories.create()` with simplified syntax (auto-generated IDs, flattened scope)
  - Add `agent.memories.search()` scoped to agent
  - Add backend-aware codecs for Turbopuffer field mapping (tvec → vector)
  - Default `include: true` for Turbopuffer queries to return all attributes

- Updated dependencies [a7d6138]
  - @kernl-sdk/retrieval@0.1.0

## 0.6.2

### Patch Changes

- c5a5fcf: Storage now auto-initializes on first operation - no need to call init() manually

## 0.6.1

### Patch Changes

- Fix ESM compatibility by adding --resolve-full-paths to tsc-alias build
- Updated dependencies
  - @kernl-sdk/shared@0.1.6
  - @kernl-sdk/protocol@0.2.5

## 0.6.0

### Minor Changes

- Migrate packages from GitHub Packages to npm registry.

  **Breaking change for `kernl` (formerly `@kernl-sdk/core`):**

  The core package has been renamed from `@kernl-sdk/core` to `kernl`. Update your imports:

  ```diff
  - import { Agent, Kernl } from "@kernl-sdk/core";
  + import { Agent, Kernl } from "kernl";
  ```

  All other packages remain under the `@kernl-sdk` scope and are now publicly available on npm.

### Patch Changes

- Updated dependencies
  - @kernl-sdk/shared@0.1.5
  - @kernl-sdk/protocol@0.2.4

## 0.5.1

### Patch Changes

- 08ab8a0: Fix duplicate thread inserts when streaming from hydrated threads by making
  storage-backed Thread instances explicitly marked as persisted, and ensure
  Postgres integration tests cover the no-double-insert behavior.

## 0.5.0

### Minor Changes

- ad56b86: Introduce the public Kernl threads API surface (`kernl.threads` and
  `agent.threads`) for listing, getting, deleting, and reading history, backed
  by simple `Thread` and `ThreadEvent` models.

  Add explicit thread creation and update APIs, including first-class `title`
  support (stored in `metadata.title`) and structured `context` / `metadata`
  patch semantics, and tighten thread persistence behavior in core + storage
  implementations to keep context and metadata consistent across in-memory and
  Postgres stores.

## 0.4.6

### Patch Changes

- Add PublicThreadEvent type to filter internal system events from client-facing APIs. ThreadResource.history and ThreadsResource.history() now return only public events (messages, tool calls, tool results), excluding internal system events.

## 0.4.5

### Patch Changes

- 8e3bac1: Add ThreadResource public API type that separates the public thread interface from internal Thread execution primitive. ThreadsResource methods now return ThreadResource with serialized data instead of Thread class instances. Add createdAt/updatedAt timestamps to threads.

## 0.4.4

### Patch Changes

- ba8119d: Fix Kernl type exports - remove duplicate old Kernl definition from dist root that was missing the threads property. The correct Kernl class with ThreadsResource is now properly exported.

## 0.4.3

### Patch Changes

- f536b15: Add clean public API for thread management with ThreadsResource class and agent-scoped thread access. Users can now access threads via `kernl.threads.get/list/delete/history()` or use agent-scoped helpers like `agent.threads.list()` that automatically filter to that agent's threads.

## 0.4.2

### Patch Changes

- Updated dependencies
  - @kernl-sdk/shared@0.1.4
  - @kernl-sdk/protocol@0.2.3

## 0.4.1

### Patch Changes

- feat: implement lazy storage initialization

  Storage is now automatically initialized on first agent execution. The `ensureInitialized()` method is called internally by spawn/schedule methods, so users never have to manually call `storage.init()`. Initialization is idempotent and concurrency-safe.

## 0.4.0

### Minor Changes

- feat: add storage infrastructure with automatic initialization

  Adds comprehensive storage infrastructure to Kernl:
  - New `KernlStorage` and `ThreadStore` interfaces for persistent thread management
  - Automatic lazy initialization of storage on first agent execution
  - Thread checkpointing at key lifecycle points (start, post-tools, terminal-tick, stop)
  - Thread resumption support - pass `{ threadId }` to agent.run() or agent.stream()
  - In-memory storage implementation as default (no setup required)
  - PostgreSQL storage adapter via `@kernl/pg`
  - LibSQL storage adapter via `@kernl/libsql`
  - Full support for thread history queries and event filtering

## 0.3.2

### Patch Changes

- fix: MCP tool schema compatibility with OpenAI

  Fixed MCP tool parameter schema serialization to match AI SDK pattern. Empty-parameter MCP tools now generate schemas with `{ type: "object", properties: {}, additionalProperties: false }` which satisfies OpenAI's strict validation requirements.

## 0.3.1

### Patch Changes

- e90f8bb: fix: handle model stream errors gracefully

  Thread.stream() now properly catches and converts model errors (like missing API keys) to error events, preventing the UI from hanging. Errors are logged via logger.error() and sent to clients as error chunks.

## 0.3.0

### Minor Changes

- Allow Agent.run() and Agent.stream() to accept LanguageModelItem[] as input
  - Update run() and stream() methods to accept `string | LanguageModelItem[]`
  - Convert string inputs to message items internally for backwards compatibility
  - Enable passing decoded UI messages directly to agent methods for multi-turn conversations

## 0.2.2

### Patch Changes

- 2c62c0a: Migrate from @kernl to @kernl-sdk scope

  All packages have been migrated to the @kernl-sdk scope for publishing to GitHub Packages under the kernl-sdk organization.

- Updated dependencies [2c62c0a]
  - @kernl-sdk/shared@0.1.3
  - @kernl-sdk/protocol@0.2.2

## 0.2.1

### Patch Changes

- Minor bug fixes and improvements
- Updated dependencies
  - @kernl-sdk/protocol@0.2.1
  - @kernl-sdk/shared@0.1.2

## 0.2.0

### Minor Changes

- 91b1285: Add agent.run() and agent.stream() convenience methods for thread execution. Kernl now mediates all thread lifecycle with spawn/schedule methods.
- fffa89e: Refactor thread execution to support streaming and fix tool schema serialization. Adds new `stream()` method for async iteration over thread events, fixes tool parameter schemas to use JSON Schema instead of raw Zod schemas.

### Patch Changes

- Updated dependencies [fffa89e]
  - @kernl-sdk/protocol@0.2.0

## 0.1.4

### Patch Changes

- Add description field to Toolkit base class and implementations

## 0.1.3

### Patch Changes

- Fix module resolution errors after kernl init and add missing exports
  - Update template tsconfig to use moduleResolution "bundler" for proper package.json exports resolution
  - Export tool, FunctionToolkit, and MCPToolkit from kernl package
  - Refactor CLI template tools into individual files with better structure

## 0.1.2

### Patch Changes

- Fix dependencies to use correct @kernl-sdk scope

## 0.1.1

### Patch Changes

- Initial release of Kernl AI agent framework with modular architecture
- Updated dependencies
  - @kernl/protocol@0.1.1
  - @kernl/shared@0.1.1

## 0.1.0

### Minor Changes

- cd1653b: Initial implementation of Kernl agent framework (v0.1.0)

  This release implements the core architecture for building agentic applications with a Linux kernel-inspired design:

  **Core Agent Framework:**
  - Agent class with instructions, model configuration, tools, and guardrails
  - Thread execution loop with tick-based model interaction
  - Context management for passing data between components
  - Lifecycle hooks for extensibility

  **Thread Execution:**
  - Multi-turn conversation handling with tool calls
  - Parallel tool execution support
  - Terminal state detection
  - State tracking (tick counter, model responses, history)

  **Tool System:**
  - Function tool definition with Zod schema validation
  - Toolkit for managing collections of tools
  - MCP (Model Context Protocol) server integration (stdio, HTTP, SSE transports)
  - Tool approval workflow support
  - Error handling with custom error functions

  **Infrastructure:**
  - Language model interface and provider registry
  - Serialization system (codec, JSON, thread, tool)
  - Tracing and observability hooks
  - Usage tracking
  - Input/output guardrails

  **Testing:**
  - Comprehensive test suite for Thread class (13 tests)
  - Tool and toolkit test coverage
  - Mock language model for testing

  This is the foundational "Hello World" implementation - a working agent that can execute tool calls and maintain conversation history.

- 6bcc501: Add comprehensive MCP testing and multi-toolkit support. Introduces 64 tests for MCP implementation and refactors agent architecture to support multiple toolkits with duplicate detection. Includes tool() and tools() methods for cross-toolkit lookups.
