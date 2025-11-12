# @kernl/cli

## 0.2.0

### Minor Changes

- 9973e38: feat: add `kernl init` command for project scaffolding

  Implement CLI scaffolding tool with the following features:
  - Interactive project initialization with `kernl init <project-name>`
  - Package manager selection (pnpm, npm, yarn)
  - Directory validation and safety checks
  - Template-based project generation with example agent and math toolkit
  - Optional dependency installation and git initialization
  - Prepared for npm publication with metadata and README

### Patch Changes

- Initial release of Kernl AI agent framework with modular architecture

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

### Patch Changes

- Updated dependencies [cd1653b]
- Updated dependencies [6bcc501]
  - @kernl/core@0.1.0
