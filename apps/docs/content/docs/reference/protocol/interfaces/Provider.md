---
layout: docs
---

# Interface: Provider

Defined in: [packages/protocol/src/provider/provider.ts:8](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/provider/provider.ts#L8)

Provider for language, text embedding, and image generation models.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="spec"></a> `spec` | `readonly` | `"1.0"` | [packages/protocol/src/provider/provider.ts:9](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/provider/provider.ts#L9) |

## Methods

### languageModel()

```ts
languageModel(modelId: string): LanguageModel;
```

Defined in: [packages/protocol/src/provider/provider.ts:16](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/provider/provider.ts#L16)

Returns the language model with the given id.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `modelId` | `string` |

#### Returns

[`LanguageModel`](LanguageModel.md)

#### Throws

If no such model exists.

***

### textEmbeddingModel()

```ts
textEmbeddingModel(modelId: string): EmbeddingModel<string>;
```

Defined in: [packages/protocol/src/provider/provider.ts:23](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/provider/provider.ts#L23)

Returns the text embedding model with the given id.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `modelId` | `string` |

#### Returns

[`EmbeddingModel`](EmbeddingModel.md)\<`string`\>

#### Throws

If no such model exists.
