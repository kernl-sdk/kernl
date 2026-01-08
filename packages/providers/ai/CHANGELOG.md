# @kernl/ai

## 0.3.4

### Patch Changes

- bb6ac60: Add lifecycle hooks for observing agent execution
  - New events: `thread.start`, `thread.stop`, `model.call.start`, `model.call.end`, `tool.call.start`, `tool.call.end`
  - Subscribe via `agent.on()` or `kernl.on()` for global hooks
  - Fixed error propagation in thread execution
  - Normalized `ErrorEvent.error` to always be an `Error` instance

- Updated dependencies [bb6ac60]
  - @kernl-sdk/protocol@0.4.1
  - @kernl-sdk/retrieval@0.1.7

## 0.3.3

### Patch Changes

- Updated dependencies [f593374]
  - @kernl-sdk/protocol@0.4.0
  - @kernl-sdk/retrieval@0.1.6

## 0.3.2

### Patch Changes

- Updated dependencies [25e46e7]
  - @kernl-sdk/shared@0.3.1
  - @kernl-sdk/protocol@0.3.1
  - @kernl-sdk/retrieval@0.1.5

## 0.3.1

### Patch Changes

- Updated dependencies [572ae80]
  - @kernl-sdk/protocol@0.3.0
  - @kernl-sdk/retrieval@0.1.4

## 0.3.0

### Minor Changes

- 3fe8682: Add native structured output support for agents

  **kernl**
  - Add `output` field to Agent config (Zod schema for structured responses)
  - Rename type params: `TResponse` → `TOutput`, `AgentResponseType` → `AgentOutputType`
  - Wire `agent.output` through Thread to protocol's `responseType`

  **@kernl-sdk/ai**
  - Add `RESPONSE_FORMAT` codec for AI SDK's `responseFormat` parameter
  - Add structured output integration tests for OpenAI, Anthropic, and Google

## 0.2.10

### Patch Changes

- Updated dependencies [2b0993d]
  - @kernl-sdk/shared@0.3.0
  - @kernl-sdk/protocol@0.2.8
  - @kernl-sdk/retrieval@0.1.3

## 0.2.9

### Patch Changes

- Bump to pick up @kernl-sdk/shared with pagination types
- Updated dependencies
  - @kernl-sdk/protocol@0.2.7
  - @kernl-sdk/retrieval@0.1.2

## 0.2.8

### Patch Changes

- Updated dependencies
  - @kernl-sdk/shared@0.2.0
  - @kernl-sdk/protocol@0.2.6
  - @kernl-sdk/retrieval@0.1.1

## 0.2.7

### Patch Changes

- Updated dependencies [a7d6138]
  - @kernl-sdk/retrieval@0.1.0

## 0.2.6

### Patch Changes

- Fix ESM compatibility by adding --resolve-full-paths to tsc-alias build
- Updated dependencies
  - @kernl-sdk/shared@0.1.6
  - @kernl-sdk/protocol@0.2.5

## 0.2.5

### Patch Changes

- Migrate packages from GitHub Packages to npm registry.

  **Breaking change for `kernl` (formerly `@kernl-sdk/core`):**

  The core package has been renamed from `@kernl-sdk/core` to `kernl`. Update your imports:

  ```diff
  - import { Agent, Kernl } from "@kernl-sdk/core";
  + import { Agent, Kernl } from "kernl";
  ```

  All other packages remain under the `@kernl-sdk` scope and are now publicly available on npm.

- Updated dependencies
  - @kernl-sdk/shared@0.1.5
  - @kernl-sdk/protocol@0.2.4

## 0.2.4

### Patch Changes

- 7946b16: Fix handling of tool calls with no required parameters. When AI providers (particularly Anthropic) send empty string arguments for tools with all optional parameters, convert to valid JSON "{}" to prevent parsing errors. Also fix tool-call state to use IN_PROGRESS instead of COMPLETED.

## 0.2.3

### Patch Changes

- 8551086: Add historyToUIMessages function to convert thread history to AI SDK UIMessage format for useChat hook. Preserves providerMetadata on all parts (text, file, reasoning, tools) and groups tool calls with results.

## 0.2.2

### Patch Changes

- Updated dependencies
  - @kernl-sdk/shared@0.1.4
  - @kernl-sdk/protocol@0.2.3

## 0.2.1

### Patch Changes

- 05ce1f1: fix: handle tool result errors with error-text output

  When a tool call fails and returns an error, the MESSAGE codec now properly encodes the error using the AI SDK's error-text output type instead of attempting to send null as a json value. This fixes the "Missing required parameter: 'output'" error that occurred when MCP tools returned errors.

## 0.2.0

### Minor Changes

- 0f25713: Add UI message and stream conversion utilities for AI SDK integration
  - Add `UIMessageCodec` for bidirectional conversion between kernl and AI SDK message formats
  - Add `toUIMessageStream()` helper to convert kernl streams to AI SDK UIMessageStream format
  - Add `STREAM_UI_PART` codec for converting LanguageModelStreamEvent to UIMessageChunk
  - Enable seamless integration with AI SDK's `useChat` hook and `createUIMessageStreamResponse`
  - Add comprehensive test suites for both UI message and stream conversion

## 0.1.4

### Patch Changes

- 2c62c0a: Migrate from @kernl to @kernl-sdk scope

  All packages have been migrated to the @kernl-sdk scope for publishing to GitHub Packages under the kernl-sdk organization.

- Updated dependencies [2c62c0a]
  - @kernl-sdk/shared@0.1.3
  - @kernl-sdk/protocol@0.2.2

## 0.1.3

### Patch Changes

- 19020a1: Fix tool call argument encoding for multi-turn conversations with Anthropic models

## 0.1.2

### Patch Changes

- Minor bug fixes and improvements
- Updated dependencies
  - @kernl-sdk/protocol@0.2.1
  - @kernl-sdk/shared@0.1.2

## 0.1.1

### Patch Changes

- Initial release of Kernl AI agent framework with modular architecture
- Updated dependencies
  - @kernl/protocol@0.1.1
  - @kernl/shared@0.1.1
