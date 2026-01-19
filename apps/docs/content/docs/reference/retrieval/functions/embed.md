---
layout: docs
---

# Function: embed()

```ts
function embed(options: {
  abortSignal?: AbortSignal;
  model: string;
  retries?: number;
  text: string;
}): Promise<{
  embedding: number[];
}>;
```

Defined in: [retrieval/src/embed.ts:18](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/embed.ts#L18)

Embed a single text value.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | \{ `abortSignal?`: `AbortSignal`; `model`: `string`; `retries?`: `number`; `text`: `string`; \} |
| `options.abortSignal?` | `AbortSignal` |
| `options.model` | `string` |
| `options.retries?` | `number` |
| `options.text` | `string` |

## Returns

`Promise`\<\{
  `embedding`: `number`[];
\}\>

## Example

```ts
import { embed } from '@kernl-sdk/retrieval';
import { openai } from '@kernl-sdk/ai/openai';

const { embedding } = await embed({
  model: 'openai/text-embedding-3-small',
  text: 'sunny day at the beach',
  retries: 2,
});
```
