---
"@kernl-sdk/protocol": patch
"@kernl-sdk/ai": patch
"kernl": patch
---

Align with @ai-sdk/provider v3 stable release

- Update LanguageModelUsage to nested structure (inputTokens.total, outputTokens.total, etc.)
- Update LanguageModelFinishReason to object with unified and raw properties
- Rename LanguageModelWarning to SharedWarning with updated structure
- Update tool type from "provider-defined" to "provider"
- Bump @ai-sdk peer dependencies from beta to stable (^3.0.3)
