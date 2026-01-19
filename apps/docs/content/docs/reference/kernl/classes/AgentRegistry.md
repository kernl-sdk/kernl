---
layout: docs
---

# Class: AgentRegistry

Defined in: [packages/kernl/src/kernl/registry.ts:39](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/kernl/registry.ts#L39)

Registry for agents.

Agents are keyed by their id and must be registered before threads can
reference them.

## Implements

- [`IAgentRegistry`](../interfaces/IAgentRegistry.md)

## Constructors

### Constructor

```ts
new AgentRegistry(): AgentRegistry;
```

#### Returns

`AgentRegistry`

## Methods

### get()

```ts
get(id: string): BaseAgent<any, "text"> | undefined;
```

Defined in: [packages/kernl/src/kernl/registry.ts:52](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/kernl/registry.ts#L52)

Get an agent by its id.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`BaseAgent`\<`any`, `"text"`\> \| `undefined`

#### Implementation of

[`IAgentRegistry`](../interfaces/IAgentRegistry.md).[`get`](../interfaces/IAgentRegistry.md#get)

***

### register()

```ts
register(agent: BaseAgent<any>): void;
```

Defined in: [packages/kernl/src/kernl/registry.ts:45](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/kernl/registry.ts#L45)

Register an agent instance. Replaces existing agent with same id.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `agent` | `BaseAgent`\<`any`\> |

#### Returns

`void`

***

### unregister()

```ts
unregister(id: string): boolean;
```

Defined in: [packages/kernl/src/kernl/registry.ts:59](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/kernl/registry.ts#L59)

Unregister an agent by id.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`boolean`

***

### values()

```ts
values(): IterableIterator<BaseAgent<any, "text">>;
```

Defined in: [packages/kernl/src/kernl/registry.ts:66](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/kernl/registry.ts#L66)

List all registered agents.

#### Returns

`IterableIterator`\<`BaseAgent`\<`any`, `"text"`\>\>
