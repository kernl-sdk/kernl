---
layout: docs
---

# Interface: SearchIndex\<TBindConfig\>

Defined in: [retrieval/src/index.ts:37](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/index.ts#L37)

Generic search index interface.

## Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `TBindConfig` | `unknown` | Provider-specific binding configuration type. Implementations can be backed by various vector databases: - pgvector (Postgres) - Turbopuffer - Pinecone - Elasticsearch - etc. |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="id"></a> `id` | `readonly` | `string` | Identifier for this search backend. e.g. "pgvector" | "turbopuffer" | "pinecone" | [retrieval/src/index.ts:42](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/index.ts#L42) |

## Methods

### bindIndex()

```ts
bindIndex(id: string, config: TBindConfig): Promise<void>;
```

Defined in: [retrieval/src/index.ts:93](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/index.ts#L93)

Bind an existing resource as an index.

Not all backends support binding. Throws if unsupported.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `config` | `TBindConfig` |

#### Returns

`Promise`\<`void`\>

***

### capabilities()

```ts
capabilities(): SearchCapabilities;
```

Defined in: [retrieval/src/index.ts:107](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/index.ts#L107)

Query backend capabilities for query planning.

#### Returns

[`SearchCapabilities`](SearchCapabilities.md)

***

### createIndex()

```ts
createIndex(params: NewIndexParams): Promise<void>;
```

Defined in: [retrieval/src/index.ts:49](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/index.ts#L49)

Create a new index.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `params` | [`NewIndexParams`](NewIndexParams.md) |

#### Returns

`Promise`\<`void`\>

***

### deleteIndex()

```ts
deleteIndex(id: string): Promise<void>;
```

Defined in: [retrieval/src/index.ts:64](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/index.ts#L64)

Delete an index and all its documents.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`Promise`\<`void`\>

***

### describeIndex()

```ts
describeIndex(id: string): Promise<IndexStats>;
```

Defined in: [retrieval/src/index.ts:59](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/index.ts#L59)

Get statistics about an index.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`Promise`\<[`IndexStats`](IndexStats.md)\>

***

### index()

```ts
index<TDocument>(id: string): IndexHandle<TDocument>;
```

Defined in: [retrieval/src/index.ts:86](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/index.ts#L86)

Get a handle for operating on a specific index.

#### Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `TDocument` | [`UnknownDocument`](../type-aliases/UnknownDocument.md) | Shape of the document fields for typed results. |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

[`IndexHandle`](IndexHandle.md)\<`TDocument`\>

#### Example

```ts
// untyped (default)
const docs = search.index("docs");
await docs.query({ content: "quick fox" });

// typed documents
interface Document { title: string; content: string; }
const docs = search.index<Document>("docs");
const hits = await docs.query({ content: "fox" });
hits[0].document?.title; // string | undefined
```

***

### listIndexes()

```ts
listIndexes(params?: ListIndexesParams): Promise<CursorPage<IndexSummary, CursorPageParams>>;
```

Defined in: [retrieval/src/index.ts:54](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/index.ts#L54)

List indexes with optional pagination and prefix filtering.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `params?` | [`ListIndexesParams`](ListIndexesParams.md) |

#### Returns

`Promise`\<`CursorPage`\<[`IndexSummary`](IndexSummary.md), `CursorPageParams`\>\>

***

### warm()

```ts
warm(id: string): Promise<void>;
```

Defined in: [retrieval/src/index.ts:102](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/retrieval/src/index.ts#L102)

Warm/preload an index for faster queries.

Not all backends support warming. Throws if unsupported.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`Promise`\<`void`\>
