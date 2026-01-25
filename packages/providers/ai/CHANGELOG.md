# @kernl/ai

## 0.5.0

### Minor Changes

- 8c855d4: feat: add xAI/Grok provider support

### Patch Changes

- Updated dependencies [772acad]
  - kernl@0.12.7

## 0.4.9

### Patch Changes

- Updated dependencies [adc9cf2]
  - kernl@0.12.6

## 0.4.8

### Patch Changes

- Updated dependencies [7fc129b]
  - kernl@0.12.5

## 0.4.7

### Patch Changes

- 4e6f569: Add Mistral AI provider support with language models and embeddings

## 0.4.6

### Patch Changes

- Updated dependencies [296c377]
  - kernl@0.12.4

## 0.4.5

### Patch Changes

- 098dd36: Fix OpenAI OAuth by passing `store: false` via model settings. AISDKLanguageModel now accepts optional default settings that are merged with per-request settings. Remove Anthropic OAuth support (blocked server-side).

## 0.4.4

### Patch Changes

- 884e513: Align with @ai-sdk/provider v3 stable release
  - Update LanguageModelUsage to nested structure (inputTokens.total, outputTokens.total, etc.)
  - Update LanguageModelFinishReason to object with unified and raw properties
  - Rename LanguageModelWarning to SharedWarning with updated structure
  - Update tool type from "provider-defined" to "provider"
  - Bump @ai-sdk peer dependencies from beta to stable (^3.0.3)

- 0040d4c: Add OAuth authentication support for OpenAI (Codex) and Anthropic providers
- Updated dependencies [884e513]
- Updated dependencies [0576a77]
  - @kernl-sdk/protocol@0.5.1
  - kernl@0.12.3
  - @kernl-sdk/retrieval@0.1.10

## 0.4.3

### Patch Changes

- 933998e: Add model ID types for autocomplete support in provider functions (anthropic, openai, google).

## 0.4.2

### Patch Changes

- Updated dependencies [11cf6fd]
  - kernl@0.12.2

## 0.4.1

### Patch Changes

- 58e9db2: Fix provider normalization and ThreadStreamEvent types
  - Normalize AI SDK provider strings (`anthropic.messages` -> `anthropic`, etc.)
  - Export `ThreadStreamEvent` from kernl for consumers
  - Update `toUIMessageStream` to accept `ThreadStreamEvent` from `agent.stream()`
  - Add `kernl` as dependency to `@kernl-sdk/ai` (breaking circular devDep)

- Updated dependencies [58e9db2]
- Updated dependencies [320b76a]
  - kernl@0.12.1

## 0.4.0

### Minor Changes

- 8815744: **BREAKING:** Refactor event kind naming from kebab-case to dot notation

  This aligns the language model stream/item kinds with the existing realtime events naming convention.

  ### Kind value changes

  | Old                | New                |
  | ------------------ | ------------------ |
  | `tool-call`        | `tool.call`        |
  | `tool-result`      | `tool.result`      |
  | `text-start`       | `text.start`       |
  | `text-delta`       | `text.delta`       |
  | `text-end`         | `text.end`         |
  | `reasoning-start`  | `reasoning.start`  |
  | `reasoning-delta`  | `reasoning.delta`  |
  | `reasoning-end`    | `reasoning.end`    |
  | `tool-input-start` | `tool.input.start` |
  | `tool-input-delta` | `tool.input.delta` |
  | `tool-input-end`   | `tool.input.end`   |
  | `stream-start`     | `stream.start`     |

  ### ToolInputStartEvent: `toolName` → `toolId`

  The `ToolInputStartEvent` now uses `toolId` to match `ToolCall` and `ToolResult`.

  ### Migration

  If you have persisted thread events, run:

  ```sql
  UPDATE thread_events SET kind = 'tool.call' WHERE kind = 'tool-call';
  UPDATE thread_events SET kind = 'tool.result' WHERE kind = 'tool-result';
  ```

### Patch Changes

- Updated dependencies [8815744]
  - @kernl-sdk/protocol@0.5.0
  - @kernl-sdk/retrieval@0.1.9

## 0.3.5

### Patch Changes

- Updated dependencies [830b52a]
  - @kernl-sdk/shared@0.4.0
  - @kernl-sdk/protocol@0.4.2
  - @kernl-sdk/retrieval@0.1.8

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
