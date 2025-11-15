---
"@kernl-sdk/ai": minor
---

Add UI message and stream conversion utilities for AI SDK integration

- Add `UIMessageCodec` for bidirectional conversion between kernl and AI SDK message formats
- Add `toUIMessageStream()` helper to convert kernl streams to AI SDK UIMessageStream format
- Add `STREAM_UI_PART` codec for converting LanguageModelStreamEvent to UIMessageChunk
- Enable seamless integration with AI SDK's `useChat` hook and `createUIMessageStreamResponse`
- Add comprehensive test suites for both UI message and stream conversion
