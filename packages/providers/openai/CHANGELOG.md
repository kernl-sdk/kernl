# @kernl-sdk/openai

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

## 0.3.2

### Patch Changes

- Updated dependencies [830b52a]
  - @kernl-sdk/shared@0.4.0
  - @kernl-sdk/protocol@0.4.2

## 0.3.1

### Patch Changes

- Updated dependencies [bb6ac60]
  - @kernl-sdk/protocol@0.4.1

## 0.3.0

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

## 0.2.1

### Patch Changes

- Updated dependencies [25e46e7]
  - @kernl-sdk/shared@0.3.1
  - @kernl-sdk/protocol@0.3.1

## 0.2.0

### Minor Changes

- 572ae80: Add realtime voice agent support with memory capabilities.
  - **protocol**: Add realtime model and event types for voice agents
  - **kernl**: Extract BaseAgent class shared by Agent and RealtimeAgent, enabling memory support for realtime agents. Add `kind` discriminator for type narrowing.
  - **openai**: Add OpenAI realtime voice provider with WebSocket-based streaming

### Patch Changes

- Updated dependencies [572ae80]
  - @kernl-sdk/protocol@0.3.0
