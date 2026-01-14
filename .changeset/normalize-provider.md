---
"@kernl-sdk/ai": patch
"kernl": patch
---

Fix provider normalization and ThreadStreamEvent types

- Normalize AI SDK provider strings (`anthropic.messages` -> `anthropic`, etc.)
- Export `ThreadStreamEvent` from kernl for consumers
- Update `toUIMessageStream` to accept `ThreadStreamEvent` from `agent.stream()`
- Add `kernl` as dependency to `@kernl-sdk/ai` (breaking circular devDep)
