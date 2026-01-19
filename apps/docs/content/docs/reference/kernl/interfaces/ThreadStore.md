---
layout: docs
---

# Interface: ThreadStore

Defined in: [packages/kernl/src/storage/thread.ts:14](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/storage/thread.ts#L14)

Thread persistence store.

## Methods

### append()

```ts
append(events: ThreadEvent[]): Promise<void>;
```

Defined in: [packages/kernl/src/storage/thread.ts:60](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/storage/thread.ts#L60)

Append events to the thread history.

Semantics:
- Guaranteed per-thread ordering via a monotonically increasing `seq`.
- Idempotent on `(tid, event.id)`: duplicate ids MUST NOT create duplicate rows.
- Events maintain insertion order.

Note:
- Thread class manages monotonic seq and timestamp assignment.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `events` | [`ThreadEvent`](../internal/type-aliases/ThreadEvent.md)[] |

#### Returns

`Promise`\<`void`\>

***

### delete()

```ts
delete(tid: string): Promise<void>;
```

Defined in: [packages/kernl/src/storage/thread.ts:42](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/storage/thread.ts#L42)

Delete a thread and cascade to thread_events.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `tid` | `string` |

#### Returns

`Promise`\<`void`\>

***

### get()

```ts
get(tid: string, include?: ThreadInclude): Promise<Thread<unknown, "text"> | null>;
```

Defined in: [packages/kernl/src/storage/thread.ts:20](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/storage/thread.ts#L20)

Get a thread by id.

Optionally include the thread_events.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `tid` | `string` |
| `include?` | [`ThreadInclude`](ThreadInclude.md) |

#### Returns

`Promise`\<[`Thread`](../internal/classes/Thread.md)\<`unknown`, `"text"`\> \| `null`\>

***

### history()

```ts
history(tid: string, options?: ThreadHistoryOptions): Promise<ThreadEvent[]>;
```

Defined in: [packages/kernl/src/storage/thread.ts:47](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/storage/thread.ts#L47)

Get the event history for a thread.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `tid` | `string` |
| `options?` | [`ThreadHistoryOptions`](ThreadHistoryOptions.md) |

#### Returns

`Promise`\<[`ThreadEvent`](../internal/type-aliases/ThreadEvent.md)[]\>

***

### insert()

```ts
insert(thread: NewThread): Promise<Thread<unknown, "text">>;
```

Defined in: [packages/kernl/src/storage/thread.ts:30](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/storage/thread.ts#L30)

Insert a new thread into the store.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `thread` | [`NewThread`](NewThread.md) |

#### Returns

`Promise`\<[`Thread`](../internal/classes/Thread.md)\<`unknown`, `"text"`\>\>

***

### list()

```ts
list(options?: ThreadListOptions): Promise<Thread<unknown, "text">[]>;
```

Defined in: [packages/kernl/src/storage/thread.ts:25](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/storage/thread.ts#L25)

List threads matching the filter.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options?` | [`ThreadListOptions`](ThreadListOptions.md) |

#### Returns

`Promise`\<[`Thread`](../internal/classes/Thread.md)\<`unknown`, `"text"`\>[]\>

***

### update()

```ts
update(tid: string, patch: ThreadUpdate): Promise<Thread<unknown, "text">>;
```

Defined in: [packages/kernl/src/storage/thread.ts:37](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/storage/thread.ts#L37)

Update thread runtime state (tick, state, metadata).

Does NOT mutate the event log, which is append-only.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `tid` | `string` |
| `patch` | [`ThreadUpdate`](ThreadUpdate.md) |

#### Returns

`Promise`\<[`Thread`](../internal/classes/Thread.md)\<`unknown`, `"text"`\>\>
