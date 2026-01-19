---
layout: docs
---

# Type Alias: ToolCallState

```ts
type ToolCallState = 
  | typeof IN_PROGRESS
  | typeof COMPLETED
  | typeof FAILED
  | typeof INTERRUPTIBLE
  | typeof UNINTERRUPTIBLE;
```

Defined in: [packages/protocol/src/language-model/item.ts:256](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L256)

State of a tool call execution.
