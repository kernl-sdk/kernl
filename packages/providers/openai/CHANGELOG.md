# @kernl-sdk/openai

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
