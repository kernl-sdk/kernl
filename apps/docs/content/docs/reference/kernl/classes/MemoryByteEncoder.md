---
layout: docs
---

# Class: MemoryByteEncoder

Defined in: [packages/kernl/src/memory/encoder.ts:46](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/encoder.ts#L46)

Encoder that converts MemoryByte to IndexableByte.

Extracts canonical text from content and computes embeddings.
If no embedder is provided, skips embedding and tvec will be undefined.

## Implements

- [`MemoryByteCodec`](../interfaces/MemoryByteCodec.md)

## Constructors

### Constructor

```ts
new MemoryByteEncoder(embedder?: EmbeddingModel<string>): MemoryByteEncoder;
```

Defined in: [packages/kernl/src/memory/encoder.ts:49](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/encoder.ts#L49)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `embedder?` | [`EmbeddingModel`](../../protocol/interfaces/EmbeddingModel.md)\<`string`\> |

#### Returns

`MemoryByteEncoder`

## Methods

### decode()

```ts
decode(_indexable: IndexableByte): Promise<MemoryByte>;
```

Defined in: [packages/kernl/src/memory/encoder.ts:88](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/encoder.ts#L88)

Decode is not implemented - IndexableByte cannot be converted back to MemoryByte.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `_indexable` | `IndexableByte` |

#### Returns

`Promise`\<[`MemoryByte`](../interfaces/MemoryByte.md)\>

#### Implementation of

[`MemoryByteCodec`](../interfaces/MemoryByteCodec.md).[`decode`](../interfaces/MemoryByteCodec.md#decode)

***

### embed()

```ts
embed(text: string): Promise<number[] | null>;
```

Defined in: [packages/kernl/src/memory/encoder.ts:98](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/encoder.ts#L98)

Embed a text string.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `text` | `string` |

#### Returns

`Promise`\<`number`[] \| `null`\>

Embedding vector, or null if no embedder configured.

#### Throws

If embedder returns empty embedding.

#### Implementation of

[`MemoryByteCodec`](../interfaces/MemoryByteCodec.md).[`embed`](../interfaces/MemoryByteCodec.md#embed)

***

### encode()

```ts
encode(byte: MemoryByte): Promise<IndexableByte>;
```

Defined in: [packages/kernl/src/memory/encoder.ts:60](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/encoder.ts#L60)

Encode a MemoryByte to IndexableByte.

- Produces `objtext` string projection for FTS indexing
- Combines text + objtext for embedding input
- Returns text (fallback to objtext if no text provided)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `byte` | [`MemoryByte`](../interfaces/MemoryByte.md) |

#### Returns

`Promise`\<`IndexableByte`\>

#### Implementation of

[`MemoryByteCodec`](../interfaces/MemoryByteCodec.md).[`encode`](../interfaces/MemoryByteCodec.md#encode)
