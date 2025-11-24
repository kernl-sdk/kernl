# @kernl/core

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
