---
"@kernl-sdk/ai": minor
---

Implement message accumulation in streaming to properly yield complete messages after delta events. Fixes infinite loop bug where missing message events prevented thread terminal state detection.
