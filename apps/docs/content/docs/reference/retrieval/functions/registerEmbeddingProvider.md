---
layout: docs
---

# Function: registerEmbeddingProvider()

```ts
function registerEmbeddingProvider(name: string, factory: EmbeddingFactory): void;
```

Defined in: [retrieval/src/embed.ts:182](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/embed.ts#L182)

Register an embedding provider.
Typically called automatically when importing provider packages.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |
| `factory` | `EmbeddingFactory` |

## Returns

`void`

## Example

```ts
import { openai } from '@ai-sdk/openai';
import { AISDKEmbeddingModel } from '@kernl-sdk/ai';

registerEmbeddingProvider('openai', (id) =>
  new AISDKEmbeddingModel(openai.embedding(id))
);
```
