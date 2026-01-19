---
layout: docs
---

# Class: Kernl

Defined in: [packages/kernl/src/kernl/kernl.ts:31](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/kernl/kernl.ts#L31)

The kernl - manages agent processes, scheduling, and task lifecycle.

Orchestrates agent execution, including guardrails, tool calls, session persistence, and
tracing.

## Extends

- `KernlHooks`

## Constructors

### Constructor

```ts
new Kernl(options: KernlOptions): Kernl;
```

Defined in: [packages/kernl/src/kernl/kernl.ts:50](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/kernl/kernl.ts#L50)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`KernlOptions`](../interfaces/KernlOptions.md) |

#### Returns

`Kernl`

#### Overrides

```ts
KernlHooks.constructor
```

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="agents"></a> `agents` | `readonly` | `RAgents` | [packages/kernl/src/kernl/kernl.ts:47](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/kernl/kernl.ts#L47) |
| <a id="athreads"></a> `athreads` | `public` | `Map`\<`string`, [`Thread`](../internal/classes/Thread.md)\<`any`, `any`\>\> | [packages/kernl/src/kernl/kernl.ts:38](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/kernl/kernl.ts#L38) |
| <a id="memories"></a> `memories` | `readonly` | [`Memory`](Memory.md) | [packages/kernl/src/kernl/kernl.ts:48](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/kernl/kernl.ts#L48) |
| <a id="storage"></a> `storage` | `readonly` | [`KernlStorage`](../interfaces/KernlStorage.md) | [packages/kernl/src/kernl/kernl.ts:37](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/kernl/kernl.ts#L37) |
| <a id="threads"></a> `threads` | `readonly` | `RThreads` | [packages/kernl/src/kernl/kernl.ts:46](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/kernl/kernl.ts#L46) |

## Methods

### emit()

```ts
emit<K>(event: K, ...args: KernlHookEvents[K]): boolean;
```

Defined in: packages/shared/dist/emitter.d.ts:28

#### Type Parameters

| Type Parameter |
| ------ |
| `K` *extends* keyof `KernlHookEvents` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `K` |
| ...`args` | `KernlHookEvents`\[`K`\] |

#### Returns

`boolean`

#### Inherited from

```ts
KernlHooks.emit
```

***

### off()

```ts
off<K>(event: K, listener: (...args: KernlHookEvents[K]) => void): this;
```

Defined in: packages/shared/dist/emitter.d.ts:26

#### Type Parameters

| Type Parameter |
| ------ |
| `K` *extends* keyof `KernlHookEvents` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `K` |
| `listener` | (...`args`: `KernlHookEvents`\[`K`\]) => `void` |

#### Returns

`this`

#### Inherited from

```ts
KernlHooks.off
```

***

### on()

```ts
on<K>(event: K, listener: (...args: KernlHookEvents[K]) => void): this;
```

Defined in: packages/shared/dist/emitter.d.ts:25

#### Type Parameters

| Type Parameter |
| ------ |
| `K` *extends* keyof `KernlHookEvents` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `K` |
| `listener` | (...`args`: `KernlHookEvents`\[`K`\]) => `void` |

#### Returns

`this`

#### Inherited from

```ts
KernlHooks.on
```

***

### once()

```ts
once<K>(event: K, listener: (...args: KernlHookEvents[K]) => void): this;
```

Defined in: packages/shared/dist/emitter.d.ts:27

#### Type Parameters

| Type Parameter |
| ------ |
| `K` *extends* keyof `KernlHookEvents` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `K` |
| `listener` | (...`args`: `KernlHookEvents`\[`K`\]) => `void` |

#### Returns

`this`

#### Inherited from

```ts
KernlHooks.once
```

***

### register()

```ts
register(agent: BaseAgent<any>): void;
```

Defined in: [packages/kernl/src/kernl/kernl.ts:68](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/kernl/kernl.ts#L68)

Registers a new agent with the kernl instance.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `agent` | `BaseAgent`\<`any`\> |

#### Returns

`void`

***

### schedule()

```ts
schedule<TContext, TOutput>(thread: Thread<TContext, TOutput>): Promise<ThreadExecuteResult<ResolvedAgentResponse<TOutput>>>;
```

Defined in: [packages/kernl/src/kernl/kernl.ts:117](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/kernl/kernl.ts#L117)

Schedule an existing thread - blocking execution

NOTE: just blocks for now

#### Type Parameters

| Type Parameter |
| ------ |
| `TContext` |
| `TOutput` *extends* `AgentOutputType` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `thread` | [`Thread`](../internal/classes/Thread.md)\<`TContext`, `TOutput`\> |

#### Returns

`Promise`\<`ThreadExecuteResult`\<`ResolvedAgentResponse`\<`TOutput`\>\>\>

***

### scheduleStream()

```ts
scheduleStream<TContext, TOutput>(thread: Thread<TContext, TOutput>): AsyncIterable<ThreadStreamEvent>;
```

Defined in: [packages/kernl/src/kernl/kernl.ts:151](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/kernl/kernl.ts#L151)

(TMP) - won't make sense with async scheduling contexts

Schedule an existing thread - streaming execution

#### Type Parameters

| Type Parameter |
| ------ |
| `TContext` |
| `TOutput` *extends* `AgentOutputType` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `thread` | [`Thread`](../internal/classes/Thread.md)\<`TContext`, `TOutput`\> |

#### Returns

`AsyncIterable`\<[`ThreadStreamEvent`](../type-aliases/ThreadStreamEvent.md)\>

***

### spawn()

```ts
spawn<TContext, TOutput>(thread: Thread<TContext, TOutput>): Promise<ThreadExecuteResult<ResolvedAgentResponse<TOutput>>>;
```

Defined in: [packages/kernl/src/kernl/kernl.ts:100](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/kernl/kernl.ts#L100)

Spawn a new thread - blocking execution

#### Type Parameters

| Type Parameter |
| ------ |
| `TContext` |
| `TOutput` *extends* `AgentOutputType` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `thread` | [`Thread`](../internal/classes/Thread.md)\<`TContext`, `TOutput`\> |

#### Returns

`Promise`\<`ThreadExecuteResult`\<`ResolvedAgentResponse`\<`TOutput`\>\>\>

***

### spawnStream()

```ts
spawnStream<TContext, TOutput>(thread: Thread<TContext, TOutput>): AsyncIterable<ThreadStreamEvent>;
```

Defined in: [packages/kernl/src/kernl/kernl.ts:134](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/kernl/kernl.ts#L134)

(TMP) - won't make sense in async scheduling contexts

Spawn a new thread - streaming execution

#### Type Parameters

| Type Parameter |
| ------ |
| `TContext` |
| `TOutput` *extends* `AgentOutputType` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `thread` | [`Thread`](../internal/classes/Thread.md)\<`TContext`, `TOutput`\> |

#### Returns

`AsyncIterable`\<[`ThreadStreamEvent`](../type-aliases/ThreadStreamEvent.md)\>
