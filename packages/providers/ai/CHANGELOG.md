# @kernl/ai

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
