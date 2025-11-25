# @kernl/cli

## 0.2.7

### Patch Changes

- Fix ESM compatibility by adding --resolve-full-paths to tsc-alias build

## 0.2.6

### Patch Changes

- Migrate packages from GitHub Packages to npm registry.

  **Breaking change for `kernl` (formerly `@kernl-sdk/core`):**

  The core package has been renamed from `@kernl-sdk/core` to `kernl`. Update your imports:

  ```diff
  - import { Agent, Kernl } from "@kernl-sdk/core";
  + import { Agent, Kernl } from "kernl";
  ```

  All other packages remain under the `@kernl-sdk` scope and are now publicly available on npm.

## 0.2.5

### Patch Changes

- 2c62c0a: Migrate from @kernl to @kernl-sdk scope

  All packages have been migrated to the @kernl-sdk scope for publishing to GitHub Packages under the kernl-sdk organization.

## 0.2.4

### Patch Changes

- 19020a1: Simplify default template math tool definitions

## 0.2.3

### Patch Changes

- Minor bug fixes and improvements

## 0.2.2

### Patch Changes

- 91b1285: Update default template to demonstrate agent.run() and agent.stream() API
- fffa89e: Update default template to use Toolkit instead of FunctionToolkit

## 0.2.1

### Patch Changes

- Fix module resolution errors after kernl init and add missing exports
  - Update template tsconfig to use moduleResolution "bundler" for proper package.json exports resolution
  - Export tool, FunctionToolkit, and MCPToolkit from kernl package
  - Refactor CLI template tools into individual files with better structure

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
