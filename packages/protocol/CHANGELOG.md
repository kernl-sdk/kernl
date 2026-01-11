# @kernl/protocol

## 0.4.2

### Patch Changes

- Updated dependencies [830b52a]
  - @kernl-sdk/shared@0.4.0

## 0.4.1

### Patch Changes

- bb6ac60: Add lifecycle hooks for observing agent execution
  - New events: `thread.start`, `thread.stop`, `model.call.start`, `model.call.end`, `tool.call.start`, `tool.call.end`
  - Subscribe via `agent.on()` or `kernl.on()` for global hooks
  - Fixed error propagation in thread execution
  - Normalized `ErrorEvent.error` to always be an `Error` instance

## 0.4.0

### Minor Changes

- f593374: Add realtime voice agents with multi-provider support.
  - `RealtimeAgent` and `RealtimeSession` for voice-enabled AI agents
  - OpenAI GPT-4o realtime with WebSocket streaming
  - xAI Grok realtime with OpenAI-compatible protocol
  - React hooks: `useRealtime`, `useBrowserAudio`, `LiveWaveform`
  - Ephemeral credential pattern for secure browser connections
  - Tool execution with client-side context support

## 0.3.1

### Patch Changes

- Updated dependencies [25e46e7]
  - @kernl-sdk/shared@0.3.1

## 0.3.0

### Minor Changes

- 572ae80: Add realtime voice agent support with memory capabilities.
  - **protocol**: Add realtime model and event types for voice agents
  - **kernl**: Extract BaseAgent class shared by Agent and RealtimeAgent, enabling memory support for realtime agents. Add `kind` discriminator for type narrowing.
  - **openai**: Add OpenAI realtime voice provider with WebSocket-based streaming

## 0.2.8

### Patch Changes

- Updated dependencies [2b0993d]
  - @kernl-sdk/shared@0.3.0

## 0.2.7

### Patch Changes

- Bump to pick up @kernl-sdk/shared with pagination types

## 0.2.6

### Patch Changes

- Updated dependencies
  - @kernl-sdk/shared@0.2.0

## 0.2.5

### Patch Changes

- Fix ESM compatibility by adding --resolve-full-paths to tsc-alias build
- Updated dependencies
  - @kernl-sdk/shared@0.1.6

## 0.2.4

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

## 0.2.3

### Patch Changes

- Updated dependencies
  - @kernl-sdk/shared@0.1.4

## 0.2.2

### Patch Changes

- 2c62c0a: Migrate from @kernl to @kernl-sdk scope

  All packages have been migrated to the @kernl-sdk scope for publishing to GitHub Packages under the kernl-sdk organization.

- Updated dependencies [2c62c0a]
  - @kernl-sdk/shared@0.1.3

## 0.2.1

### Patch Changes

- Minor bug fixes and improvements
- Updated dependencies
  - @kernl-sdk/shared@0.1.2

## 0.2.0

### Minor Changes

- fffa89e: Add thread/task state constants and language model helper functions

## 0.1.1

### Patch Changes

- Initial release of Kernl AI agent framework with modular architecture
