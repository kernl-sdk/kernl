# @kernl/core

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
