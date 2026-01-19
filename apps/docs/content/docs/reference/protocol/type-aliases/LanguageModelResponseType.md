---
layout: docs
---

# Type Alias: LanguageModelResponseType

```ts
type LanguageModelResponseType = 
  | LanguageModelResponseText
  | LanguageModelResponseJSON;
```

Defined in: [packages/protocol/src/language-model/request.ts:55](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/request.ts#L55)

Response format specification for language model output.

The output can either be text or JSON. Default is text.
If JSON is selected, a schema can optionally be provided to guide the LLM.
