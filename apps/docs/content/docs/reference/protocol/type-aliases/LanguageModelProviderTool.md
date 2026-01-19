---
layout: docs
---

# Type Alias: LanguageModelProviderTool

```ts
type LanguageModelProviderTool = {
  args: Record<string, unknown>;
  id: `${string}.${string}`;
  kind: "provider-defined";
  name: string;
};
```

Defined in: [packages/protocol/src/language-model/tool.ts:39](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/tool.ts#L39)

The configuration of a tool that is defined by the provider.

## Properties

### args

```ts
args: Record<string, unknown>;
```

Defined in: [packages/protocol/src/language-model/tool.ts:55](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/tool.ts#L55)

The arguments for configuring the tool. Must match the expected arguments defined by the provider for this tool.

***

### id

```ts
id: `${string}.${string}`;
```

Defined in: [packages/protocol/src/language-model/tool.ts:45](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/tool.ts#L45)

The ID of the tool. Should follow the format `<provider-id>.<unique-tool-name>`.

***

### kind

```ts
readonly kind: "provider-defined";
```

Defined in: [packages/protocol/src/language-model/tool.ts:40](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/tool.ts#L40)

***

### name

```ts
name: string;
```

Defined in: [packages/protocol/src/language-model/tool.ts:50](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/tool.ts#L50)

The name of the tool that the user must use in the tool set.
