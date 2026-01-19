---
layout: docs
---

# Interface: IModelRegistry

Defined in: [packages/kernl/src/kernl/types.ts:105](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/kernl/types.ts#L105)

Model registry interface.

Satisfied by Map<string, LanguageModel>.
Key format: "provider/modelId"

TODO: Create an exhaustive model registry in the protocol package
with all supported models and their metadata.

## Methods

### get()

```ts
get(key: string): 
  | LanguageModel
  | undefined;
```

Defined in: [packages/kernl/src/kernl/types.ts:106](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/kernl/types.ts#L106)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `string` |

#### Returns

  \| [`LanguageModel`](../../protocol/interfaces/LanguageModel.md)
  \| `undefined`
