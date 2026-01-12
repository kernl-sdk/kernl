---
"@kernl-sdk/protocol": minor
"@kernl-sdk/ai": minor
"@kernl-sdk/openai": minor
"@kernl-sdk/xai": minor
"kernl": minor
"@kernl-sdk/storage": minor
---

**BREAKING:** Refactor event kind naming from kebab-case to dot notation

This aligns the language model stream/item kinds with the existing realtime events naming convention.

### Kind value changes

| Old | New |
|-----|-----|
| `tool-call` | `tool.call` |
| `tool-result` | `tool.result` |
| `text-start` | `text.start` |
| `text-delta` | `text.delta` |
| `text-end` | `text.end` |
| `reasoning-start` | `reasoning.start` |
| `reasoning-delta` | `reasoning.delta` |
| `reasoning-end` | `reasoning.end` |
| `tool-input-start` | `tool.input.start` |
| `tool-input-delta` | `tool.input.delta` |
| `tool-input-end` | `tool.input.end` |
| `stream-start` | `stream.start` |

### ToolInputStartEvent: `toolName` → `toolId`

The `ToolInputStartEvent` now uses `toolId` to match `ToolCall` and `ToolResult`.

### Migration

If you have persisted thread events, run:

```sql
UPDATE thread_events SET kind = 'tool.call' WHERE kind = 'tool-call';
UPDATE thread_events SET kind = 'tool.result' WHERE kind = 'tool-result';
```
