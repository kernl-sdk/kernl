---
layout: docs
---

# Interface: KernlStorage

Defined in: [packages/kernl/src/storage/base.ts:14](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/storage/base.ts#L14)

The main storage interface for Kernl.

Provides access to system stores (threads, tasks, traces) and transaction support.

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="memories"></a> `memories` | [`MemoryStore`](MemoryStore.md) | Memory store - manages memory records for agents. | [packages/kernl/src/storage/base.ts:23](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/storage/base.ts#L23) |
| <a id="threads"></a> `threads` | [`ThreadStore`](ThreadStore.md) | Thread store - manages thread execution records and event history. | [packages/kernl/src/storage/base.ts:18](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/storage/base.ts#L18) |

## Methods

### bind()

```ts
bind(registries: {
  agents: IAgentRegistry;
  models: IModelRegistry;
}): void;
```

Defined in: [packages/kernl/src/storage/base.ts:33](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/storage/base.ts#L33)

Bind runtime registries to storage.

Called by Kernl after construction to wire up agent/model lookups.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `registries` | \{ `agents`: [`IAgentRegistry`](IAgentRegistry.md); `models`: [`IModelRegistry`](IModelRegistry.md); \} |
| `registries.agents` | [`IAgentRegistry`](IAgentRegistry.md) |
| `registries.models` | [`IModelRegistry`](IModelRegistry.md) |

#### Returns

`void`

***

### close()

```ts
close(): Promise<void>;
```

Defined in: [packages/kernl/src/storage/base.ts:53](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/storage/base.ts#L53)

Close the storage backend and cleanup resources.

#### Returns

`Promise`\<`void`\>

***

### init()

```ts
init(): Promise<void>;
```

Defined in: [packages/kernl/src/storage/base.ts:48](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/storage/base.ts#L48)

Initialize the storage backend.

Connects to the database and ensures all required schemas/tables exist.

#### Returns

`Promise`\<`void`\>

***

### migrate()

```ts
migrate(): Promise<void>;
```

Defined in: [packages/kernl/src/storage/base.ts:58](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/storage/base.ts#L58)

Runs the migrations in order to ensure all required tables exist.

#### Returns

`Promise`\<`void`\>

***

### transaction()

```ts
transaction<T>(fn: (tx: Transaction) => Promise<T>): Promise<T>;
```

Defined in: [packages/kernl/src/storage/base.ts:41](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/storage/base.ts#L41)

Execute a function within a transaction.

All operations performed using the transaction-scoped stores will be
committed atomically or rolled back on error.

#### Type Parameters

| Type Parameter |
| ------ |
| `T` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `fn` | (`tx`: [`Transaction`](Transaction.md)) => `Promise`\<`T`\> |

#### Returns

`Promise`\<`T`\>
