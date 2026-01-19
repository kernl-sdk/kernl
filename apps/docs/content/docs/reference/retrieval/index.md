---
layout: docs
---

# @kernl-sdk/retrieval

> **For AI agents**: These reference docs help coding agents understand the kernl SDK. If your agent gets stuck, share this page with it.

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
  limit: 10,
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

## Interfaces

| Interface | Description |
| ------ | ------ |
| [DeleteDocParams](interfaces/DeleteDocParams.md) | Parameters for deleting a single document. |
| [DeleteIndexParams](interfaces/DeleteIndexParams.md) | Parameters for deleting an index. |
| [DeleteManyParams](interfaces/DeleteManyParams.md) | Parameters for deleting multiple documents. |
| [DeleteResult](interfaces/DeleteResult.md) | Result of a delete operation. |
| [DenseVector](interfaces/DenseVector.md) | Dense vector embedding. |
| [DescribeIndexParams](interfaces/DescribeIndexParams.md) | Parameters for describing an index. |
| [FieldOps](interfaces/FieldOps.md) | Field-level operators for filtering. |
| [Filter](interfaces/Filter.md) | MongoDB-style filter expression. |
| [FTSOptions](interfaces/FTSOptions.md) | Full-text search options for a field. |
| [GeoPoint](interfaces/GeoPoint.md) | Geographic point. |
| [IndexHandle](interfaces/IndexHandle.md) | Handle to a specific index. |
| [IndexStats](interfaces/IndexStats.md) | Statistics about an index. |
| [IndexSummary](interfaces/IndexSummary.md) | Summary of an index returned in list results. |
| [ListIndexesParams](interfaces/ListIndexesParams.md) | Parameters for listing indexes. |
| [LogicalOps](interfaces/LogicalOps.md) | Logical operators for combining filters. |
| [NewIndexParams](interfaces/NewIndexParams.md) | Parameters for creating a new index. |
| [OrderBy](interfaces/OrderBy.md) | Order by specification. |
| [PatchResult](interfaces/PatchResult.md) | Result of a patch operation. |
| [PlannedQuery](interfaces/PlannedQuery.md) | Result of planning a query against backend capabilities. |
| [RankingSignal](interfaces/RankingSignal.md) | A single ranking signal (text or vector query on a field). |
| [ScalarFieldSchema](interfaces/ScalarFieldSchema.md) | Schema for scalar/complex fields. |
| [SearchCapabilities](interfaces/SearchCapabilities.md) | Backend capabilities for query planning. |
| [SearchHit](interfaces/SearchHit.md) | A search result hit. |
| [SearchIndex](interfaces/SearchIndex.md) | Generic search index interface. |
| [SearchQuery](interfaces/SearchQuery.md) | Full search query options. |
| [SparseVector](interfaces/SparseVector.md) | Sparse vector (for hybrid/BM25 style search). |
| [UpsertResult](interfaces/UpsertResult.md) | Result of an upsert operation. |
| [VectorFieldSchema](interfaces/VectorFieldSchema.md) | Schema for vector fields. |

## Type Aliases

| Type Alias | Description |
| ------ | ------ |
| [DocumentPatch](type-aliases/DocumentPatch.md) | Document patch - partial update with null to unset fields. |
| [FieldSchema](type-aliases/FieldSchema.md) | Field schema - either scalar or vector. |
| [FieldValue](type-aliases/FieldValue.md) | Field value - the actual data stored in a field. |
| [QueryInput](type-aliases/QueryInput.md) | Query input - flexible format supporting multiple patterns. |
| [ScalarValue](type-aliases/ScalarValue.md) | - |
| [SearchFieldType](type-aliases/SearchFieldType.md) | Supported field types in a search schema. |
| [SearchMode](type-aliases/SearchMode.md) | Supported search modes. |
| [UnknownDocument](type-aliases/UnknownDocument.md) | - |

## Functions

| Function | Description |
| ------ | ------ |
| [embed](functions/embed.md) | Embed a single text value. |
| [embedMany](functions/embedMany.md) | Embed multiple text values. |
| [isHybridQuery](functions/isHybridQuery.md) | Check if query input is an array (hybrid sum fusion). |
| [isQueryOptions](functions/isQueryOptions.md) | Check if query input is a full query options object. |
| [isSimpleQuery](functions/isSimpleQuery.md) | Check if query input is a simple single-field query. |
| [normalizeQuery](functions/normalizeQuery.md) | Normalize query input to full QueryOptions. |
| [planQuery](functions/planQuery.md) | Plan a query against backend capabilities. |
| [registerEmbeddingProvider](functions/registerEmbeddingProvider.md) | Register an embedding provider. Typically called automatically when importing provider packages. |
| [resolveEmbeddingModel](functions/resolveEmbeddingModel.md) | Resolve an embedding model from a provider/model-id string. |
