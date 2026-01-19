---
layout: docs
---

# Interface: MemoryByteCodec

Defined in: [packages/kernl/src/memory/types.ts:77](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/types.ts#L77)

Encoder that converts MemoryByte to IndexableByte with embeddings.

## Extends

- `AsyncCodec`\<[`MemoryByte`](MemoryByte.md), `IndexableByte`\>

## Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="decode"></a> `decode` | (`val`: `IndexableByte`) => `Promise`\<[`MemoryByte`](MemoryByte.md)\> | Transform from output format to input format. | `AsyncCodec.decode` | packages/shared/dist/lib/codec.d.ts:36 |
| <a id="encode"></a> `encode` | (`val`: [`MemoryByte`](MemoryByte.md)) => `Promise`\<`IndexableByte`\> | Transform from input format to output format. | `AsyncCodec.encode` | packages/shared/dist/lib/codec.d.ts:32 |

## Methods

### embed()

```ts
embed(text: string): Promise<number[] | null>;
```

Defined in: [packages/kernl/src/memory/types.ts:83](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/types.ts#L83)

Embed a text string.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `text` | `string` |

#### Returns

`Promise`\<`number`[] \| `null`\>

Embedding vector, or null if no embedder configured.
