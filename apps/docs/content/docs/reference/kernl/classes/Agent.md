---
layout: docs
---

# Class: Agent\<TContext, TOutput\>

Defined in: [packages/kernl/src/agent.ts:34](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/agent.ts#L34)

## Extends

- `BaseAgent`\<`TContext`, `TOutput`\>

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TContext` | `UnknownContext` |
| `TOutput` *extends* `AgentOutputType` | `TextOutput` |

## Implements

- `AgentConfig`\<`TContext`, `TOutput`\>

## Constructors

### Constructor

```ts
new Agent<TContext, TOutput>(config: AgentConfig<TContext, TOutput>): Agent<TContext, TOutput>;
```

Defined in: [packages/kernl/src/agent.ts:52](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/agent.ts#L52)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `config` | `AgentConfig`\<`TContext`, `TOutput`\> |

#### Returns

`Agent`\<`TContext`, `TOutput`\>

#### Overrides

```ts
BaseAgent<TContext, TOutput>.constructor
```

## Properties

| Property | Modifier | Type | Default value | Description | Overrides | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="description"></a> `description?` | `readonly` | `string` | `undefined` | - | - | `AgentConfig.description` `Agent`.[`description`](#description) | [packages/kernl/src/agent/base.ts:58](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/agent/base.ts#L58) |
| <a id="guardrails"></a> `guardrails` | `readonly` | \{ `input`: `InputGuardrail`[]; `output`: `OutputGuardrail`\<`AgentOutputType`\>[]; \} | `undefined` | A list of checks that run in parallel to the agent's execution on the input + output for the agent, depending on the configuration. | - | - | [packages/kernl/src/agent.ts:45](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/agent.ts#L45) |
| `guardrails.input` | `public` | `InputGuardrail`[] | `undefined` | - | - | - | [packages/kernl/src/agent.ts:46](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/agent.ts#L46) |
| `guardrails.output` | `public` | `OutputGuardrail`\<`AgentOutputType`\>[] | `undefined` | - | - | - | [packages/kernl/src/agent.ts:47](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/agent.ts#L47) |
| <a id="id"></a> `id` | `readonly` | `string` | `undefined` | - | - | `AgentConfig.id` `Agent`.[`id`](#id) | [packages/kernl/src/agent/base.ts:56](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/agent/base.ts#L56) |
| <a id="instructions"></a> `instructions` | `readonly` | (`context`: [`Context`](Context.md)\<`TContext`\>) => `string` \| `Promise`\<`string`\> | `undefined` | - | - | `AgentConfig.instructions` `BaseAgent.instructions` | [packages/kernl/src/agent/base.ts:59](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/agent/base.ts#L59) |
| <a id="kernl"></a> `kernl?` | `protected` | [`Kernl`](Kernl.md) | `undefined` | - | - | `Agent`.[`kernl`](#kernl) | [packages/kernl/src/agent/base.ts:51](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/agent/base.ts#L51) |
| <a id="kind"></a> `kind` | `readonly` | `"llm"` | `"llm"` | - | `BaseAgent.kind` | - | [packages/kernl/src/agent.ts:41](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/agent.ts#L41) |
| <a id="memory"></a> `memory` | `readonly` | `AgentMemoryConfig` | `undefined` | - | - | `AgentConfig.memory` `Agent`.[`memory`](#memory) | [packages/kernl/src/agent/base.ts:64](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/agent/base.ts#L64) |
| <a id="model"></a> `model` | `readonly` | [`LanguageModel`](../../protocol/interfaces/LanguageModel.md) | `undefined` | - | `AgentConfig.model` `BaseAgent.model` | - | [packages/kernl/src/agent.ts:42](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/agent.ts#L42) |
| <a id="modelsettings"></a> `modelSettings` | `readonly` | [`LanguageModelRequestSettings`](../../protocol/interfaces/LanguageModelRequestSettings.md) | `undefined` | Configures model-specific tuning parameters (e.g. temperature, top_p, etc.) | - | - | [packages/kernl/src/agent.ts:43](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/agent.ts#L43) |
| <a id="name"></a> `name` | `readonly` | `string` | `undefined` | - | - | `AgentConfig.name` `Agent`.[`name`](#name) | [packages/kernl/src/agent/base.ts:57](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/agent/base.ts#L57) |
| <a id="output"></a> `output` | `readonly` | `TOutput` | `undefined` | The type of the output that the agent will return. Can be either: - `"text"` (default): The agent returns a plain string response - A Zod schema: The agent returns structured output validated against the schema When a Zod schema is provided, the output is converted to JSON Schema and sent to the model for native structured output support. The response is then validated against the Zod schema as a safety net. | - | - | [packages/kernl/src/agent.ts:49](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/agent.ts#L49) |
| <a id="resettoolchoice"></a> `resetToolChoice` | `readonly` | `boolean` | `undefined` | Whether to reset the tool choice to the default value after a tool has been called. Defaults to `true`. This ensures that the agent doesn't enter an infinite loop of tool usage. | - | - | [packages/kernl/src/agent.ts:50](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/agent.ts#L50) |
| <a id="systools"></a> `systools` | `readonly` | `BaseToolkit`\<`TContext`\>[] | `undefined` | - | - | `BaseAgent.systools` | [packages/kernl/src/agent/base.ts:63](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/agent/base.ts#L63) |
| <a id="toolkits"></a> `toolkits` | `readonly` | `BaseToolkit`\<`TContext`\>[] | `undefined` | - | - | `AgentConfig.toolkits` `BaseAgent.toolkits` | [packages/kernl/src/agent/base.ts:62](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/agent/base.ts#L62) |

## Accessors

### memories

#### Get Signature

```ts
get memories(): {
  create: (params: AgentMemoryCreate) => Promise<MemoryRecord>;
  list: (params?: Omit<MemoryListOptions, "filter"> & {
     collection?: string;
     limit?: number;
  }) => Promise<MemoryRecord[]>;
  search: (params: Omit<MemorySearchQuery, "filter"> & {
     filter?: Omit<MemoryFilter, "scope"> & {
        scope?: Omit<Partial<MemoryScope>, "agentId">;
     };
  }) => Promise<SearchHit<IndexMemoryRecord>[]>;
  update: (params: AgentMemoryUpdate) => Promise<MemoryRecord>;
};
```

Defined in: [packages/kernl/src/agent/base.ts:158](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/agent/base.ts#L158)

Memory management scoped to this agent.

##### Returns

```ts
{
  create: (params: AgentMemoryCreate) => Promise<MemoryRecord>;
  list: (params?: Omit<MemoryListOptions, "filter"> & {
     collection?: string;
     limit?: number;
  }) => Promise<MemoryRecord[]>;
  search: (params: Omit<MemorySearchQuery, "filter"> & {
     filter?: Omit<MemoryFilter, "scope"> & {
        scope?: Omit<Partial<MemoryScope>, "agentId">;
     };
  }) => Promise<SearchHit<IndexMemoryRecord>[]>;
  update: (params: AgentMemoryUpdate) => Promise<MemoryRecord>;
}
```

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `create()` | (`params`: `AgentMemoryCreate`) => `Promise`\<[`MemoryRecord`](../type-aliases/MemoryRecord.md)\> | [packages/kernl/src/agent/base.ts:183](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/agent/base.ts#L183) |
| `list()` | (`params?`: `Omit`\<[`MemoryListOptions`](../interfaces/MemoryListOptions.md), `"filter"`\> & \{ `collection?`: `string`; `limit?`: `number`; \}) => `Promise`\<[`MemoryRecord`](../type-aliases/MemoryRecord.md)[]\> | [packages/kernl/src/agent/base.ts:169](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/agent/base.ts#L169) |
| `search()` | (`params`: `Omit`\<[`MemorySearchQuery`](../interfaces/MemorySearchQuery.md), `"filter"`\> & \{ `filter?`: `Omit`\<[`MemoryFilter`](../interfaces/MemoryFilter.md), `"scope"`\> & \{ `scope?`: `Omit`\<`Partial`\<[`MemoryScope`](../interfaces/MemoryScope.md)\>, `"agentId"`\>; \}; \}) => `Promise`\<[`SearchHit`](../../retrieval/interfaces/SearchHit.md)\<`IndexMemoryRecord`\>[]\> | [packages/kernl/src/agent/base.ts:210](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/agent/base.ts#L210) |
| `update()` | (`params`: `AgentMemoryUpdate`) => `Promise`\<[`MemoryRecord`](../type-aliases/MemoryRecord.md)\> | [packages/kernl/src/agent/base.ts:200](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/agent/base.ts#L200) |

#### Inherited from

```ts
BaseAgent.memories
```

***

### threads

#### Get Signature

```ts
get threads(): {
  create: (params: Omit<ThreadCreateParams, "agentId" | "model">) => Promise<Thread>;
  delete: (tid: string) => Promise<void>;
  get: (tid: string, options?: ThreadGetOptions) => Promise<Thread | null>;
  history: (tid: string, params?: ThreadHistoryParams) => Promise<ThreadEvent[]>;
  list: (params: Omit<ThreadsListParams, "agentId">) => Promise<CursorPage<Thread, ThreadsListParams>>;
  update: (tid: string, patch: ThreadUpdateParams) => Promise<Thread | null>;
};
```

Defined in: [packages/kernl/src/agent.ts:210](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/agent.ts#L210)

Thread management scoped to this agent.

Convenience wrapper around kernl.threads that automatically filters to this agent's threads.

##### Returns

```ts
{
  create: (params: Omit<ThreadCreateParams, "agentId" | "model">) => Promise<Thread>;
  delete: (tid: string) => Promise<void>;
  get: (tid: string, options?: ThreadGetOptions) => Promise<Thread | null>;
  history: (tid: string, params?: ThreadHistoryParams) => Promise<ThreadEvent[]>;
  list: (params: Omit<ThreadsListParams, "agentId">) => Promise<CursorPage<Thread, ThreadsListParams>>;
  update: (tid: string, patch: ThreadUpdateParams) => Promise<Thread | null>;
}
```

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `create()` | (`params`: `Omit`\<[`ThreadCreateParams`](../interfaces/ThreadCreateParams.md), `"agentId"` \| `"model"`\>) => `Promise`\<[`Thread`](../interfaces/Thread.md)\> | [packages/kernl/src/agent.ts:228](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/agent.ts#L228) |
| `delete()` | (`tid`: `string`) => `Promise`\<`void`\> | [packages/kernl/src/agent.ts:225](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/agent.ts#L225) |
| `get()` | (`tid`: `string`, `options?`: [`ThreadGetOptions`](../interfaces/ThreadGetOptions.md)) => `Promise`\<[`Thread`](../interfaces/Thread.md) \| `null`\> | [packages/kernl/src/agent.ts:221](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/agent.ts#L221) |
| `history()` | (`tid`: `string`, `params?`: [`ThreadHistoryParams`](../interfaces/ThreadHistoryParams.md)) => `Promise`\<[`ThreadEvent`](../type-aliases/ThreadEvent.md)[]\> | [packages/kernl/src/agent.ts:226](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/agent.ts#L226) |
| `list()` | (`params`: `Omit`\<[`ThreadsListParams`](../interfaces/ThreadsListParams.md), `"agentId"`\>) => `Promise`\<`CursorPage`\<[`Thread`](../interfaces/Thread.md), [`ThreadsListParams`](../interfaces/ThreadsListParams.md)\>\> | [packages/kernl/src/agent.ts:223](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/agent.ts#L223) |
| `update()` | (`tid`: `string`, `patch`: [`ThreadUpdateParams`](../interfaces/ThreadUpdateParams.md)) => `Promise`\<[`Thread`](../interfaces/Thread.md) \| `null`\> | [packages/kernl/src/agent.ts:237](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/agent.ts#L237) |

## Methods

### bind()

```ts
bind(kernl: Kernl): void;
```

Defined in: [packages/kernl/src/agent/base.ts:92](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/agent/base.ts#L92)

Bind this agent to a kernl instance. Called by kernl.register().

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `kernl` | [`Kernl`](Kernl.md) |

#### Returns

`void`

#### Inherited from

```ts
BaseAgent.bind
```

***

### emit()

```ts
emit<K>(event: K, ...args: AgentHookEvents<TContext, TOutput>[K]): boolean;
```

Defined in: [packages/kernl/src/agent/base.ts:107](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/agent/base.ts#L107)

Emit a lifecycle event to agent and kernl listeners.

#### Type Parameters

| Type Parameter |
| ------ |
| `K` *extends* keyof `AgentHookEvents`\<`TContext`, `TOutput`\> |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `K` |
| ...`args` | `AgentHookEvents`\<`TContext`, `TOutput`\>\[`K`\] |

#### Returns

`boolean`

#### Inherited from

```ts
BaseAgent.emit
```

***

### off()

```ts
off<K>(event: K, listener: (...args: AgentHookEvents<TContext, TOutput>[K]) => void): this;
```

Defined in: packages/shared/dist/emitter.d.ts:26

#### Type Parameters

| Type Parameter |
| ------ |
| `K` *extends* keyof `AgentHookEvents`\<`TContext`, `TOutput`\> |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `K` |
| `listener` | (...`args`: `AgentHookEvents`\<`TContext`, `TOutput`\>\[`K`\]) => `void` |

#### Returns

`this`

#### Inherited from

```ts
BaseAgent.off
```

***

### on()

```ts
on<K>(event: K, listener: (...args: AgentHookEvents<TContext, TOutput>[K]) => void): this;
```

Defined in: packages/shared/dist/emitter.d.ts:25

#### Type Parameters

| Type Parameter |
| ------ |
| `K` *extends* keyof `AgentHookEvents`\<`TContext`, `TOutput`\> |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `K` |
| `listener` | (...`args`: `AgentHookEvents`\<`TContext`, `TOutput`\>\[`K`\]) => `void` |

#### Returns

`this`

#### Inherited from

```ts
BaseAgent.on
```

***

### once()

```ts
once<K>(event: K, listener: (...args: AgentHookEvents<TContext, TOutput>[K]) => void): this;
```

Defined in: packages/shared/dist/emitter.d.ts:27

#### Type Parameters

| Type Parameter |
| ------ |
| `K` *extends* keyof `AgentHookEvents`\<`TContext`, `TOutput`\> |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `K` |
| `listener` | (...`args`: `AgentHookEvents`\<`TContext`, `TOutput`\>\[`K`\]) => `void` |

#### Returns

`this`

#### Inherited from

```ts
BaseAgent.once
```

***

### run()

```ts
run(input: 
  | string
| LanguageModelItem[], options?: ThreadExecuteOptions<TContext>): Promise<ThreadExecuteResult<ResolvedAgentResponse<TOutput>>>;
```

Defined in: [packages/kernl/src/agent.ts:70](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/agent.ts#L70)

Blocking execution - spawns or resumes thread and waits for completion

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | \| `string` \| [`LanguageModelItem`](../../protocol/type-aliases/LanguageModelItem.md)[] |
| `options?` | `ThreadExecuteOptions`\<`TContext`\> |

#### Returns

`Promise`\<`ThreadExecuteResult`\<`ResolvedAgentResponse`\<`TOutput`\>\>\>

#### Throws

If the specified thread is already running (concurrent execution not allowed)

#### Throws

If the agent is not bound to a kernl instance

***

### stream()

```ts
stream(input: 
  | string
| LanguageModelItem[], options?: ThreadExecuteOptions<TContext>): AsyncIterable<ThreadStreamEvent>;
```

Defined in: [packages/kernl/src/agent.ts:141](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/agent.ts#L141)

Streaming execution - spawns or resumes thread and returns async iterator

NOTE: streaming probably won't make sense in scheduling contexts so spawnStream etc. won't make sense

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | \| `string` \| [`LanguageModelItem`](../../protocol/type-aliases/LanguageModelItem.md)[] |
| `options?` | `ThreadExecuteOptions`\<`TContext`\> |

#### Returns

`AsyncIterable`\<[`ThreadStreamEvent`](../type-aliases/ThreadStreamEvent.md)\>

#### Throws

If the specified thread is already running (concurrent execution not allowed)

#### Throws

If the agent is not bound to a kernl instance

***

### tool()

```ts
tool(id: string): Tool<TContext> | undefined;
```

Defined in: [packages/kernl/src/agent/base.ts:119](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/agent/base.ts#L119)

Get a specific tool by ID from systools and toolkits.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`Tool`\<`TContext`\> \| `undefined`

#### Inherited from

```ts
BaseAgent.tool
```

***

### tools()

```ts
tools(context: Context<TContext>): Promise<Tool<TContext>[]>;
```

Defined in: [packages/kernl/src/agent/base.ts:136](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/agent/base.ts#L136)

Get all tools available from systools and toolkits for the given context.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `context` | [`Context`](Context.md)\<`TContext`\> |

#### Returns

`Promise`\<`Tool`\<`TContext`\>[]\>

#### Inherited from

```ts
BaseAgent.tools
```
