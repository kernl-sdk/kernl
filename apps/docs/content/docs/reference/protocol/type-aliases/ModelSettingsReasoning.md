---
layout: docs
---

# Type Alias: ModelSettingsReasoning

```ts
type ModelSettingsReasoning = {
  effort?:   | ModelSettingsReasoningEffort
     | null;
  summary?: "auto" | "concise" | "detailed" | null;
};
```

Defined in: [packages/protocol/src/language-model/request.ts:186](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/request.ts#L186)

Configuration options for model reasoning

## Properties

### effort?

```ts
optional effort: 
  | ModelSettingsReasoningEffort
  | null;
```

Defined in: [packages/protocol/src/language-model/request.ts:190](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/request.ts#L190)

Constrains effort on reasoning for [reasoning models](https://platform.openai.com/docs/guides/reasoning).

***

### summary?

```ts
optional summary: "auto" | "concise" | "detailed" | null;
```

Defined in: [packages/protocol/src/language-model/request.ts:197](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/request.ts#L197)

A summary of the reasoning performed by the model.
This can be useful for debugging and understanding the model's reasoning process.
One of `auto`, `concise`, or `detailed`.
