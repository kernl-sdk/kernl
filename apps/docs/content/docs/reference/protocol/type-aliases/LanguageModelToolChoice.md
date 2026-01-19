---
layout: docs
---

# Type Alias: LanguageModelToolChoice

```ts
type LanguageModelToolChoice = 
  | {
  kind: "auto";
}
  | {
  kind: "none";
}
  | {
  kind: "required";
}
  | {
  kind: "tool";
  toolId: string;
};
```

Defined in: [packages/protocol/src/language-model/request.ts:162](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/request.ts#L162)
