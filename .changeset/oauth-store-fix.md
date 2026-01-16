---
"@kernl-sdk/ai": patch
---

Fix OpenAI OAuth by passing `store: false` via model settings. AISDKLanguageModel now accepts optional default settings that are merged with per-request settings. Remove Anthropic OAuth support (blocked server-side).
