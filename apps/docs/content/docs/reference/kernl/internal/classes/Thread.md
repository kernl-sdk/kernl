---
layout: docs
---

# Class: Thread\<TContext, TOutput\>

Defined in: [packages/kernl/src/thread/thread.ts:90](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/thread/thread.ts#L90)

A thread drives the execution loop for an agent.

Ground principles:

  1) Event log is source of truth.
     - Persistent storage (e.g. Postgres) is treated as an append-only per-thread log of `ThreadEvent`s:
       monotonic `seq`, no gaps, no updates/deletes.
     - `Thread.state`, `tick`, etc. are projections of that log, not an alternative source of truth.

  2) Single writer per thread.
     - At most one executor is allowed for a given `tid` at a time.
     - Callers are responsible for enforcing this (e.g. locking/versioning) so two processes cannot
       interleave or race on `seq` or state.

  3) Persist before use / observation.
     - Before an event can:
       - influence a future tick (i.e. be part of `history` fed back into the model), or
       - be considered “delivered” to a client,
       it SHOULD be durably written to storage when storage is configured.

  4) Transaction boundaries match semantic steps.
     - The intended strategy is to buffer within a tick, then atomically persist all new events + state
       at the end of `tick()`.
     - After a crash, you only ever see whole ticks or none, never half a tick, from the store’s
       point of view.

  5) Recovery is replay.
     - On restart, callers rebuild a `Thread` from the stored event log (plus optional snapshots).
     - Any incomplete tick or pending tool call is handled by a clear, deterministic policy at a
       higher layer (e.g. re-run, mark failed, or require manual intervention).

On storage failures:

  “If storage is configured, it is authoritative” → fail hard on persist errors rather than
  treating persistence as best-effort.

  If a storage implementation is present, `persist(...)` is expected to throw on failure, and
  that error should bubble out of `_execute()` / `stream()` and stop the thread.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TContext` | `unknown` |
| `TOutput` *extends* `AgentOutputType` | `"text"` |

## Constructors

### Constructor

```ts
new Thread<TContext, TOutput>(options: ThreadOptions<TContext, TOutput>): Thread<TContext, TOutput>;
```

Defined in: [packages/kernl/src/thread/thread.ts:117](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/thread/thread.ts#L117)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | `ThreadOptions`\<`TContext`, `TOutput`\> |

#### Returns

`Thread`\<`TContext`, `TOutput`\>

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="_seq"></a> `_seq` | `public` | `number` | [packages/kernl/src/thread/thread.ts:107](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/thread/thread.ts#L107) |
| <a id="_tick"></a> `_tick` | `public` | `number` | [packages/kernl/src/thread/thread.ts:106](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/thread/thread.ts#L106) |
| <a id="agent"></a> `agent` | `readonly` | [`Agent`](../../classes/Agent.md)\<`TContext`, `TOutput`\> | [packages/kernl/src/thread/thread.ts:96](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/thread/thread.ts#L96) |
| <a id="context"></a> `context` | `public` | [`Context`](../../classes/Context.md)\<`TContext`\> | [packages/kernl/src/thread/thread.ts:97](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/thread/thread.ts#L97) |
| <a id="createdat"></a> `createdAt` | `readonly` | `Date` | [packages/kernl/src/thread/thread.ts:100](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/thread/thread.ts#L100) |
| <a id="metadata"></a> `metadata` | `readonly` | `Record`\<`string`, `unknown`\> \| `null` | [packages/kernl/src/thread/thread.ts:102](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/thread/thread.ts#L102) |
| <a id="model"></a> `model` | `public` | [`LanguageModel`](../../../protocol/interfaces/LanguageModel.md) | [packages/kernl/src/thread/thread.ts:98](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/thread/thread.ts#L98) |
| <a id="namespace"></a> `namespace` | `readonly` | `string` | [packages/kernl/src/thread/thread.ts:95](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/thread/thread.ts#L95) |
| <a id="parent"></a> `parent` | `readonly` | `Task`\<`TContext`, `unknown`\> \| `null` | [packages/kernl/src/thread/thread.ts:99](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/thread/thread.ts#L99) |
| <a id="state"></a> `state` | `public` | [`ThreadState`](../../type-aliases/ThreadState.md) | [packages/kernl/src/thread/thread.ts:108](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/thread/thread.ts#L108) |
| <a id="tid"></a> `tid` | `readonly` | `string` | [packages/kernl/src/thread/thread.ts:94](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/thread/thread.ts#L94) |
| <a id="updatedat"></a> `updatedAt` | `readonly` | `Date` | [packages/kernl/src/thread/thread.ts:101](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/thread/thread.ts#L101) |

## Methods

### append()

```ts
append(...items: LanguageModelItem[]): ThreadEvent[];
```

Defined in: [packages/kernl/src/thread/thread.ts:375](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/thread/thread.ts#L375)

Append one or more items to history + enrich w/ runtime headers.

Core rule:

> An event becomes a ThreadEvent (and gets seq/timestamp) exactly when it is appended to history. <

#### Parameters

| Parameter | Type |
| ------ | ------ |
| ...`items` | [`LanguageModelItem`](../../../protocol/type-aliases/LanguageModelItem.md)[] |

#### Returns

[`ThreadEvent`](../type-aliases/ThreadEvent.md)[]

***

### cancel()

```ts
cancel(): void;
```

Defined in: [packages/kernl/src/thread/thread.ts:397](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/thread/thread.ts#L397)

Cancel the running thread

TODO: Emit thread.stop when cancelled (neither result nor error set)

#### Returns

`void`

***

### execute()

```ts
execute(): Promise<ThreadExecuteResult<ResolvedAgentResponse<TOutput>>>;
```

Defined in: [packages/kernl/src/thread/thread.ts:152](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/thread/thread.ts#L152)

Blocking execution - runs until terminal state or interruption

#### Returns

`Promise`\<`ThreadExecuteResult`\<`ResolvedAgentResponse`\<`TOutput`\>\>\>

***

### stream()

```ts
stream(): AsyncIterable<ThreadStreamEvent>;
```

Defined in: [packages/kernl/src/thread/thread.ts:170](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/thread/thread.ts#L170)

Streaming execution - returns async iterator of events

All runs (new or resumed) emit:
  - Exactly one thread.start
  - Zero or more model.call.* and tool.call.*
  - Exactly one thread.stop (with result on success, error on failure)

#### Returns

`AsyncIterable`\<[`ThreadStreamEvent`](../../type-aliases/ThreadStreamEvent.md)\>
