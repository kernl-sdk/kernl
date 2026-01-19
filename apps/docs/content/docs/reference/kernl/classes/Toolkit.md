---
layout: docs
---

# Class: Toolkit\<TContext\>

Defined in: [packages/kernl/src/tool/toolkit.ts:85](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/tool/toolkit.ts#L85)

A toolkit containing static function tools.

## Example

```ts
const fs = new FunctionToolkit({
  id: "fs",
  tools: [readFile, writeFile, listDir, ...]
});
```

## Extends

- `BaseToolkit`\<`TContext`\>

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TContext` | `UnknownContext` |

## Constructors

### Constructor

```ts
new Toolkit<TContext>(config: FunctionToolkitConfig<TContext>): FunctionToolkit<TContext>;
```

Defined in: [packages/kernl/src/tool/toolkit.ts:97](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/tool/toolkit.ts#L97)

Create a new function toolkit.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `config` | `FunctionToolkitConfig`\<`TContext`\> | Toolkit configuration with id and tools array |

#### Returns

`FunctionToolkit`\<`TContext`\>

#### Overrides

```ts
BaseToolkit<TContext>.constructor
```

## Properties

| Property | Modifier | Type | Description | Overrides | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="agent"></a> `agent?` | `protected` | `BaseAgent`\<`any`, `"text"`\> | The agent this toolkit is bound to (if any). Uses `any` to allow toolkits with different context types to be composed in the same agent. | - | `BaseToolkit.agent` | [packages/kernl/src/tool/toolkit.ts:37](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/tool/toolkit.ts#L37) |
| <a id="description"></a> `description` | `readonly` | `string` | Description of what this toolkit provides | `BaseToolkit.description` | - | [packages/kernl/src/tool/toolkit.ts:89](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/tool/toolkit.ts#L89) |
| <a id="id"></a> `id` | `readonly` | `string` | Unique identifier for this toolkit | `BaseToolkit.id` | - | [packages/kernl/src/tool/toolkit.ts:88](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/tool/toolkit.ts#L88) |

## Methods

### bind()

```ts
bind(agent: BaseAgent<any>): void;
```

Defined in: [packages/kernl/src/tool/toolkit.ts:43](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/tool/toolkit.ts#L43)

Bind this toolkit to an agent.
Called by agent constructor.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `agent` | `BaseAgent`\<`any`\> |

#### Returns

`void`

#### Inherited from

```ts
BaseToolkit.bind
```

***

### destroy()

```ts
destroy(): Promise<void>;
```

Defined in: [packages/kernl/src/tool/toolkit.ts:69](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/tool/toolkit.ts#L69)

Cleanup resources held by this toolkit.
Override if your toolkit needs cleanup (e.g., closing connections).
Default implementation does nothing.

#### Returns

`Promise`\<`void`\>

#### Inherited from

```ts
BaseToolkit.destroy
```

***

### get()

```ts
get(id: string): Tool<TContext> | undefined;
```

Defined in: [packages/kernl/src/tool/toolkit.ts:110](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/tool/toolkit.ts#L110)

Get a specific tool by ID.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | `string` | The tool ID to look up |

#### Returns

`Tool`\<`TContext`\> \| `undefined`

The tool if found, undefined otherwise

#### Overrides

```ts
BaseToolkit.get
```

***

### list()

```ts
list(context?: Context<TContext>): Promise<Tool<TContext>[]>;
```

Defined in: [packages/kernl/src/tool/toolkit.ts:120](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/tool/toolkit.ts#L120)

List all tools in this toolkit.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `context?` | [`Context`](Context.md)\<`TContext`\> | Optional context for filtering tools (currently unused) |

#### Returns

`Promise`\<`Tool`\<`TContext`\>[]\>

Array of all tools in this toolkit

#### Overrides

```ts
BaseToolkit.list
```
