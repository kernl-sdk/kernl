---
layout: docs
---

# Class: Memory

Defined in: [packages/kernl/src/memory/memory.ts:33](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/memory.ts#L33)

Memory is the primary memory abstraction for agents.

Sits above storage/index layers + owns cognitive policy, eviction/TTL, consolidation.

 - L1 / wmem: active working set exposed to the model
 - L2 / smem: bounded recent context with a TTL
 - L3 / lmem: durable, structured long-term store

Delegates persistence to storage adapters and optional indexes as
_projections_ of the primary memory store.

## Constructors

### Constructor

```ts
new Memory(config: MemoryConfig): Memory;
```

Defined in: [packages/kernl/src/memory/memory.ts:40](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/memory.ts#L40)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `config` | [`MemoryConfig`](../interfaces/MemoryConfig.md) |

#### Returns

`Memory`

## Methods

### create()

```ts
create(memory: NewMemory): Promise<MemoryRecord>;
```

Defined in: [packages/kernl/src/memory/memory.ts:53](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/memory.ts#L53)

Create a new memory record.
Writes to primary store first, then indexes if configured.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `memory` | [`NewMemory`](../interfaces/NewMemory.md) |

#### Returns

`Promise`\<[`MemoryRecord`](../type-aliases/MemoryRecord.md)\>

***

### list()

```ts
list(options?: MemoryListOptions): Promise<MemoryRecord[]>;
```

Defined in: [packages/kernl/src/memory/memory.ts:107](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/memory.ts#L107)

List memories matching the filter.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options?` | [`MemoryListOptions`](../interfaces/MemoryListOptions.md) |

#### Returns

`Promise`\<[`MemoryRecord`](../type-aliases/MemoryRecord.md)[]\>

***

### loadShortTermMemory()

```ts
loadShortTermMemory(scope: MemoryScope): Promise<ShortTermMemorySnapshot>;
```

Defined in: [packages/kernl/src/memory/memory.ts:143](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/memory.ts#L143)

Load short-term memory (L2) - active smem for the scope.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`MemoryScope`](../interfaces/MemoryScope.md) |

#### Returns

`Promise`\<[`ShortTermMemorySnapshot`](../interfaces/ShortTermMemorySnapshot.md)\>

***

### loadWorkingMemory()

```ts
loadWorkingMemory(scope: MemoryScope): Promise<WorkingMemorySnapshot>;
```

Defined in: [packages/kernl/src/memory/memory.ts:133](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/memory.ts#L133)

Load working memory (L1) - wmem-pinned memories for the scope.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`MemoryScope`](../interfaces/MemoryScope.md) |

#### Returns

`Promise`\<[`WorkingMemorySnapshot`](../interfaces/WorkingMemorySnapshot.md)\>

***

### reindex()

```ts
reindex(params: MemoryReindexParams): Promise<void>;
```

Defined in: [packages/kernl/src/memory/memory.ts:114](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/memory.ts#L114)

Repair indexing for a memory without modifying the DB row.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `params` | [`MemoryReindexParams`](../interfaces/MemoryReindexParams.md) |

#### Returns

`Promise`\<`void`\>

***

### search()

```ts
search(q: MemorySearchQuery): Promise<SearchHit<IndexMemoryRecord>[]>;
```

Defined in: [packages/kernl/src/memory/memory.ts:90](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/memory.ts#L90)

Semantic/metadata search across memories.

Sends rich query with both text and vector - the index handle
adapts based on backend capabilities (e.g. drops text for pgvector).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `q` | [`MemorySearchQuery`](../interfaces/MemorySearchQuery.md) |

#### Returns

`Promise`\<[`SearchHit`](../../retrieval/interfaces/SearchHit.md)\<`IndexMemoryRecord`\>[]\>

***

### update()

```ts
update(update: MemoryRecordUpdate): Promise<MemoryRecord>;
```

Defined in: [packages/kernl/src/memory/memory.ts:69](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/memory.ts#L69)

Update an existing memory record.
Updates primary store, then re-indexes or patches search index.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `update` | [`MemoryRecordUpdate`](../interfaces/MemoryRecordUpdate.md) |

#### Returns

`Promise`\<[`MemoryRecord`](../type-aliases/MemoryRecord.md)\>
