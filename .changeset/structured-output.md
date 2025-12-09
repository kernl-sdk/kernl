---
"kernl": minor
"@kernl-sdk/ai": minor
---

Add native structured output support for agents

**kernl**
- Add `output` field to Agent config (Zod schema for structured responses)
- Rename type params: `TResponse` → `TOutput`, `AgentResponseType` → `AgentOutputType`
- Wire `agent.output` through Thread to protocol's `responseType`

**@kernl-sdk/ai**
- Add `RESPONSE_FORMAT` codec for AI SDK's `responseFormat` parameter
- Add structured output integration tests for OpenAI, Anthropic, and Google
