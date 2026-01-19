---
layout: docs
---

# Function: resolveEmbeddingModel()

```ts
function resolveEmbeddingModel<TValue>(modelId: string): EmbeddingModel<TValue>;
```

Defined in: [retrieval/src/embed.ts:138](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/embed.ts#L138)

Resolve an embedding model from a provider/model-id string.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TValue` | `string` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `modelId` | `string` |

## Returns

[`EmbeddingModel`](../../protocol/interfaces/EmbeddingModel.md)\<`TValue`\>

## Example

```ts
import { resolveEmbeddingModel } from '@kernl-sdk/retrieval';
import '@kernl-sdk/ai/openai'; // registers provider

const model = resolveEmbeddingModel('openai/text-embedding-3-small');
const result = await model.embed({ values: ['hello world'] });
```
