---
layout: docs
---

# Interface: EmbeddingModelRequest\<TValue\>

Defined in: [packages/protocol/src/embedding-model/request.ts:3](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/embedding-model/request.ts#L3)

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TValue` | `string` |

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="abort"></a> `abort?` | `AbortSignal` | Abort signal for cancelling the operation. | [packages/protocol/src/embedding-model/request.ts:17](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/embedding-model/request.ts#L17) |
| <a id="settings"></a> `settings?` | [`EmbeddingModelRequestSettings`](EmbeddingModelRequestSettings.md) | Optional settings for the embedding request. | [packages/protocol/src/embedding-model/request.ts:12](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/embedding-model/request.ts#L12) |
| <a id="values"></a> `values` | `TValue`[] | Values to embed. | [packages/protocol/src/embedding-model/request.ts:7](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/embedding-model/request.ts#L7) |
