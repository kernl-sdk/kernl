---
layout: docs
---

# Function: embedMany()

```ts
function embedMany(options: {
  abortSignal?: AbortSignal;
  concurrency?: number;
  model: string;
  retries?: number;
  texts: string[];
}): Promise<{
  embeddings: number[][];
}>;
```

Defined in: [retrieval/src/embed.ts:65](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/embed.ts#L65)

Embed multiple text values.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | \{ `abortSignal?`: `AbortSignal`; `concurrency?`: `number`; `model`: `string`; `retries?`: `number`; `texts`: `string`[]; \} |
| `options.abortSignal?` | `AbortSignal` |
| `options.concurrency?` | `number` |
| `options.model` | `string` |
| `options.retries?` | `number` |
| `options.texts` | `string`[] |

## Returns

`Promise`\<\{
  `embeddings`: `number`[][];
\}\>

## Example

```ts
import { embedMany } from '@kernl-sdk/retrieval';
import { openai } from '@kernl-sdk/ai/openai';

const { embeddings } = await embedMany({
  model: 'openai/text-embedding-3-small',
  texts: ['hello', 'world'],
  concurrency: 5,
});
```
