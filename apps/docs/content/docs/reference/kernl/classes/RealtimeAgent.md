---
layout: docs
---

# Class: RealtimeAgent\<TContext\>

Defined in: [packages/kernl/src/realtime/agent.ts:14](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/realtime/agent.ts#L14)

A realtime agent definition.

Stateless configuration that describes what a realtime voice agent does.
Create sessions with `new RealtimeSession(agent, options)`.

## Extends

- `BaseAgent`\<`TContext`\>

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TContext` | `UnknownContext` |

## Constructors

### Constructor

```ts
new RealtimeAgent<TContext>(config: RealtimeAgentConfig<TContext>): RealtimeAgent<TContext>;
```

Defined in: [packages/kernl/src/realtime/agent.ts:19](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/realtime/agent.ts#L19)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `config` | [`RealtimeAgentConfig`](../interfaces/RealtimeAgentConfig.md)\<`TContext`\> |

#### Returns

`RealtimeAgent`\<`TContext`\>

#### Overrides

```ts
BaseAgent<TContext>.constructor
```

## Properties

| Property | Modifier | Type | Default value | Overrides | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="description"></a> `description?` | `readonly` | `string` | `undefined` | - | `BaseAgent.description` | [packages/kernl/src/agent/base.ts:58](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/agent/base.ts#L58) |
| <a id="id"></a> `id` | `readonly` | `string` | `undefined` | - | `BaseAgent.id` | [packages/kernl/src/agent/base.ts:56](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/agent/base.ts#L56) |
| <a id="instructions"></a> `instructions` | `readonly` | (`context`: [`Context`](Context.md)\<`TContext`\>) => `string` \| `Promise`\<`string`\> | `undefined` | - | `BaseAgent.instructions` | [packages/kernl/src/agent/base.ts:59](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/agent/base.ts#L59) |
| <a id="kernl"></a> `kernl?` | `protected` | [`Kernl`](Kernl.md) | `undefined` | - | `BaseAgent.kernl` | [packages/kernl/src/agent/base.ts:51](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/agent/base.ts#L51) |
| <a id="kind"></a> `kind` | `readonly` | `"realtime"` | `"realtime"` | `BaseAgent.kind` | - | [packages/kernl/src/realtime/agent.ts:15](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/realtime/agent.ts#L15) |
| <a id="memory"></a> `memory` | `readonly` | `AgentMemoryConfig` | `undefined` | - | `BaseAgent.memory` | [packages/kernl/src/agent/base.ts:64](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/agent/base.ts#L64) |
| <a id="model"></a> `model` | `readonly` | [`RealtimeModel`](../../protocol/interfaces/RealtimeModel.md) | `undefined` | `BaseAgent.model` | - | [packages/kernl/src/realtime/agent.ts:16](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/realtime/agent.ts#L16) |
| <a id="name"></a> `name` | `readonly` | `string` | `undefined` | - | `BaseAgent.name` | [packages/kernl/src/agent/base.ts:57](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/agent/base.ts#L57) |
| <a id="systools"></a> `systools` | `readonly` | `BaseToolkit`\<`TContext`\>[] | `undefined` | - | `BaseAgent.systools` | [packages/kernl/src/agent/base.ts:63](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/agent/base.ts#L63) |
| <a id="toolkits"></a> `toolkits` | `readonly` | `BaseToolkit`\<`TContext`\>[] | `undefined` | - | `BaseAgent.toolkits` | [packages/kernl/src/agent/base.ts:62](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/agent/base.ts#L62) |
| <a id="voice"></a> `voice?` | `readonly` | [`RealtimeAgentVoiceConfig`](../interfaces/RealtimeAgentVoiceConfig.md) | `undefined` | - | - | [packages/kernl/src/realtime/agent.ts:17](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/realtime/agent.ts#L17) |

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
emit<K>(event: K, ...args: AgentHookEvents<TContext, "text">[K]): boolean;
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
| ...`args` | `AgentHookEvents`\<`TContext`, `"text"`\>\[`K`\] |

#### Returns

`boolean`

#### Inherited from

```ts
BaseAgent.emit
```

***

### off()

```ts
off<K>(event: K, listener: (...args: AgentHookEvents<TContext, "text">[K]) => void): this;
```

Defined in: packages/shared/dist/emitter.d.ts:26

#### Type Parameters

| Type Parameter |
| ------ |
| `K` *extends* keyof `AgentHookEvents`\<`TContext`, `"text"`\> |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `K` |
| `listener` | (...`args`: `AgentHookEvents`\<`TContext`, `"text"`\>\[`K`\]) => `void` |

#### Returns

`this`

#### Inherited from

```ts
BaseAgent.off
```

***

### on()

```ts
on<K>(event: K, listener: (...args: AgentHookEvents<TContext, "text">[K]) => void): this;
```

Defined in: packages/shared/dist/emitter.d.ts:25

#### Type Parameters

| Type Parameter |
| ------ |
| `K` *extends* keyof `AgentHookEvents`\<`TContext`, `"text"`\> |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `K` |
| `listener` | (...`args`: `AgentHookEvents`\<`TContext`, `"text"`\>\[`K`\]) => `void` |

#### Returns

`this`

#### Inherited from

```ts
BaseAgent.on
```

***

### once()

```ts
once<K>(event: K, listener: (...args: AgentHookEvents<TContext, "text">[K]) => void): this;
```

Defined in: packages/shared/dist/emitter.d.ts:27

#### Type Parameters

| Type Parameter |
| ------ |
| `K` *extends* keyof `AgentHookEvents`\<`TContext`, `"text"`\> |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `K` |
| `listener` | (...`args`: `AgentHookEvents`\<`TContext`, `"text"`\>\[`K`\]) => `void` |

#### Returns

`this`

#### Inherited from

```ts
BaseAgent.once
```

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
