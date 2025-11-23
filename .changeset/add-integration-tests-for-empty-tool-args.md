---
"@kernl-sdk/ai": patch
---

Fix handling of tool calls with no required parameters. When AI providers (particularly Anthropic) send empty string arguments for tools with all optional parameters, convert to valid JSON "{}" to prevent parsing errors. Also fix tool-call state to use IN_PROGRESS instead of COMPLETED.
