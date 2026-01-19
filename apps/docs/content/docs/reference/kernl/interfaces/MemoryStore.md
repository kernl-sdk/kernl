---
layout: docs
---

# Interface: MemoryStore

Defined in: [packages/kernl/src/memory/store.ts:17](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/store.ts#L17)

Memory persistence store.

Follows the same pattern as ThreadStore - simple CRUD operations.

## Methods

### create()

```ts
create(memory: NewMemory): Promise<MemoryRecord>;
```

Defined in: [packages/kernl/src/memory/store.ts:31](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/store.ts#L31)

Create a new memory.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `memory` | [`NewMemory`](NewMemory.md) |

#### Returns

`Promise`\<[`MemoryRecord`](../type-aliases/MemoryRecord.md)\>

***

### delete()

```ts
delete(id: string): Promise<void>;
```

Defined in: [packages/kernl/src/memory/store.ts:41](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/store.ts#L41)

Delete a memory.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`Promise`\<`void`\>

***

### get()

```ts
get(id: string): Promise<MemoryRecord | null>;
```

Defined in: [packages/kernl/src/memory/store.ts:21](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/store.ts#L21)

Get a memory by ID.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`Promise`\<[`MemoryRecord`](../type-aliases/MemoryRecord.md) \| `null`\>

***

### list()

```ts
list(options?: MemoryListOptions): Promise<MemoryRecord[]>;
```

Defined in: [packages/kernl/src/memory/store.ts:26](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/store.ts#L26)

List memories matching the filter.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options?` | [`MemoryListOptions`](MemoryListOptions.md) |

#### Returns

`Promise`\<[`MemoryRecord`](../type-aliases/MemoryRecord.md)[]\>

***

### mdelete()

```ts
mdelete(ids: string[]): Promise<void>;
```

Defined in: [packages/kernl/src/memory/store.ts:46](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/store.ts#L46)

Delete multiple memories.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `ids` | `string`[] |

#### Returns

`Promise`\<`void`\>

***

### update()

```ts
update(id: string, patch: MemoryRecordUpdate): Promise<MemoryRecord>;
```

Defined in: [packages/kernl/src/memory/store.ts:36](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/memory/store.ts#L36)

Update an existing memory.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `patch` | [`MemoryRecordUpdate`](MemoryRecordUpdate.md) |

#### Returns

`Promise`\<[`MemoryRecord`](../type-aliases/MemoryRecord.md)\>
