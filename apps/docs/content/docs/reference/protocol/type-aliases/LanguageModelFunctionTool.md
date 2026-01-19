---
layout: docs
---

# Type Alias: LanguageModelFunctionTool

```ts
type LanguageModelFunctionTool = {
  description?: string;
  kind: "function";
  name: string;
  parameters: JSONSchema7;
  providerOptions?: SharedProviderOptions;
};
```

Defined in: [packages/protocol/src/language-model/tool.ts:10](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/tool.ts#L10)

A tool has a name, a description, and a set of parameters.

Note: this is **not** the user-facing tool definition. The AI SDK methods will
map the user-facing tool definitions to this format.

## Properties

### description?

```ts
optional description: string;
```

Defined in: [packages/protocol/src/language-model/tool.ts:22](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/tool.ts#L22)

A description of the tool. The language model uses this to understand the
tool's purpose and to provide better completion suggestions.

***

### kind

```ts
readonly kind: "function";
```

Defined in: [packages/protocol/src/language-model/tool.ts:11](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/tool.ts#L11)

***

### name

```ts
name: string;
```

Defined in: [packages/protocol/src/language-model/tool.ts:16](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/tool.ts#L16)

The name of the tool. Unique within this model call.

***

### parameters

```ts
parameters: JSONSchema7;
```

Defined in: [packages/protocol/src/language-model/tool.ts:28](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/tool.ts#L28)

The parameters that the tool expects. The language model uses this to
understand the tool's input requirements and to provide matching suggestions.

***

### providerOptions?

```ts
optional providerOptions: SharedProviderOptions;
```

Defined in: [packages/protocol/src/language-model/tool.ts:33](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/tool.ts#L33)

The provider-specific options for the tool.
