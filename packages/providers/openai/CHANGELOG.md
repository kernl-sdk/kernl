# @kernl-sdk/openai

## 0.2.0

### Minor Changes

- 572ae80: Add realtime voice agent support with memory capabilities.
  - **protocol**: Add realtime model and event types for voice agents
  - **kernl**: Extract BaseAgent class shared by Agent and RealtimeAgent, enabling memory support for realtime agents. Add `kind` discriminator for type narrowing.
  - **openai**: Add OpenAI realtime voice provider with WebSocket-based streaming

### Patch Changes

- Updated dependencies [572ae80]
  - @kernl-sdk/protocol@0.3.0
