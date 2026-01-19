---
layout: docs
---

# Function: reasoning()

```ts
function reasoning(options: {
  providerMetadata?: SharedProviderMetadata;
  text: string;
}): Reasoning;
```

Defined in: [packages/protocol/src/language-model/utils.ts:28](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/utils.ts#L28)

Create a reasoning item

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | \{ `providerMetadata?`: [`SharedProviderMetadata`](../type-aliases/SharedProviderMetadata.md); `text`: `string`; \} |
| `options.providerMetadata?` | [`SharedProviderMetadata`](../type-aliases/SharedProviderMetadata.md) |
| `options.text` | `string` |

## Returns

[`Reasoning`](../interfaces/Reasoning.md)
