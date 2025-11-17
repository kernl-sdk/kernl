# @kernl/core

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
