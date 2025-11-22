---
"@kernl-sdk/ai": patch
---

Add historyToUIMessages function to convert thread history to AI SDK UIMessage format for useChat hook. Preserves providerMetadata on all parts (text, file, reasoning, tools) and groups tool calls with results.
