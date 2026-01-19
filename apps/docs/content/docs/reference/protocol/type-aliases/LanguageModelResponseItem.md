---
layout: docs
---

# Type Alias: LanguageModelResponseItem

```ts
type LanguageModelResponseItem = 
  | AssistantMessage
  | Reasoning
  | ToolCall
  | ToolResult;
```

Defined in: [packages/protocol/src/language-model/item.ts:17](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/item.ts#L17)

A subset of LanguageModelItem that excludes items that wouldn't
make sense for a model to generate (e.g. system/user messages, tool results).
