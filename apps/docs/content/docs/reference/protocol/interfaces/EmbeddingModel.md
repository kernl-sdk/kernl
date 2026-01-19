---
layout: docs
---

# Interface: EmbeddingModel\<TValue\>

Defined in: [packages/protocol/src/embedding-model/model.ts:17](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/embedding-model/model.ts#L17)

Embedding model interface.

TValue is the type of values that can be embedded.
Currently string for text, but could support images, audio, etc. in the future.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TValue` | `string` |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="maxembeddingspercall"></a> `maxEmbeddingsPerCall?` | `readonly` | `number` | Maximum number of values that can be embedded in a single call. undefined means no limit is known. | [packages/protocol/src/embedding-model/model.ts:37](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/embedding-model/model.ts#L37) |
| <a id="modelid"></a> `modelId` | `readonly` | `string` | Provider-specific model ID. | [packages/protocol/src/embedding-model/model.ts:31](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/embedding-model/model.ts#L31) |
| <a id="provider"></a> `provider` | `readonly` | `string` | Provider ID. | [packages/protocol/src/embedding-model/model.ts:26](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/embedding-model/model.ts#L26) |
| <a id="spec"></a> `spec` | `readonly` | `"1.0"` | The embedding model must specify which embedding model interface version it implements. | [packages/protocol/src/embedding-model/model.ts:21](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/embedding-model/model.ts#L21) |
| <a id="supportsparallelcalls"></a> `supportsParallelCalls?` | `readonly` | `boolean` | Whether this model can handle multiple embed calls in parallel. | [packages/protocol/src/embedding-model/model.ts:42](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/embedding-model/model.ts#L42) |

## Methods

### embed()

```ts
embed(request: EmbeddingModelRequest<TValue>): Promise<EmbeddingModelResponse>;
```

Defined in: [packages/protocol/src/embedding-model/model.ts:49](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/embedding-model/model.ts#L49)

Generate embeddings for the given input values.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `request` | [`EmbeddingModelRequest`](EmbeddingModelRequest.md)\<`TValue`\> | The embedding request. |

#### Returns

`Promise`\<[`EmbeddingModelResponse`](EmbeddingModelResponse.md)\>
