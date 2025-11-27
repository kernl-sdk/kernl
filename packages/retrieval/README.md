# @kernl-sdk/retrieval

Generic search and retrieval abstractions for kernl.

## Search

Provider-agnostic interface for text + vector search:

```ts
import type { SearchIndex, IndexHandle } from '@kernl-sdk/retrieval';

// -- index lifecycle --
await search.createIndex({ id: 'docs', dimensions: 1536 });
const docs: IndexHandle = search.index('docs');

// query with vectors + text
const hits = await docs.query({
  query: [{ text: 'search query', tvec: [0.1, 0.2, ...] }],
  filter: { category: 'technical' },
  topK: 10,
});

// upsert documents
await docs.upsert({ id: '1', text: 'content', tvec: [...] });
```

## Embeddings

Simple text embedding with auto-registered providers:

```ts
import { embed, embedMany } from '@kernl-sdk/retrieval';
import { openai } from '@kernl-sdk/ai/openai';

// single text
const { embedding } = await embed({
  model: 'openai/text-embedding-3-small',
  text: 'sunny day at the beach',
});

// multiple texts
const { embeddings } = await embedMany({
  model: 'openai/text-embedding-3-small',
  texts: ['hello', 'world'],
});
```

### Supported Providers

- OpenAI: `import { openai } from '@kernl-sdk/ai/openai'`
- Google: `import { google } from '@kernl-sdk/ai/google'`
