---
"@kernl-sdk/protocol": minor
"kernl": minor
"@kernl-sdk/openai": minor
---

Add realtime voice agent support with memory capabilities.

- **protocol**: Add realtime model and event types for voice agents
- **kernl**: Extract BaseAgent class shared by Agent and RealtimeAgent, enabling memory support for realtime agents. Add `kind` discriminator for type narrowing.
- **openai**: Add OpenAI realtime voice provider with WebSocket-based streaming
