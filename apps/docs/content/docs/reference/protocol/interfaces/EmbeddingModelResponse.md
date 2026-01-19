---
layout: docs
---

# Interface: EmbeddingModelResponse

Defined in: [packages/protocol/src/embedding-model/model.ts:57](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/embedding-model/model.ts#L57)

The response from an embedding model.

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="embeddings"></a> `embeddings` | [`Embedding`](../type-aliases/Embedding.md)[] | Generated embeddings in the same order as input values. | [packages/protocol/src/embedding-model/model.ts:61](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/embedding-model/model.ts#L61) |
| <a id="providermetadata"></a> `providerMetadata?` | [`SharedProviderMetadata`](../type-aliases/SharedProviderMetadata.md) | Provider-specific metadata. | [packages/protocol/src/embedding-model/model.ts:71](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/embedding-model/model.ts#L71) |
| <a id="usage"></a> `usage` | [`EmbeddingModelUsage`](EmbeddingModelUsage.md) | Token usage for the embedding call. | [packages/protocol/src/embedding-model/model.ts:66](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/embedding-model/model.ts#L66) |
