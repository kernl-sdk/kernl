---
layout: docs
---

# Class: MCPToolkit\<TContext\>

Defined in: [packages/kernl/src/tool/toolkit.ts:161](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/tool/toolkit.ts#L161)

## Extends

- `BaseToolkit`\<`TContext`\>

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TContext` | `UnknownContext` |

## Constructors

### Constructor

```ts
new MCPToolkit<TContext>(config: MCPToolkitConfig<TContext>): MCPToolkit<TContext>;
```

Defined in: [packages/kernl/src/tool/toolkit.ts:178](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/tool/toolkit.ts#L178)

Create a new MCP toolkit.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `config` | `MCPToolkitConfig`\<`TContext`\> | Toolkit configuration with id and server instance |

#### Returns

`MCPToolkit`\<`TContext`\>

#### Overrides

```ts
BaseToolkit<TContext>.constructor
```

## Properties

| Property | Modifier | Type | Description | Overrides | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="agent"></a> `agent?` | `protected` | `BaseAgent`\<`any`, `"text"`\> | The agent this toolkit is bound to (if any). Uses `any` to allow toolkits with different context types to be composed in the same agent. | - | `BaseToolkit.agent` | [packages/kernl/src/tool/toolkit.ts:37](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/tool/toolkit.ts#L37) |
| <a id="description"></a> `description` | `readonly` | `string` | Description of what this toolkit provides | `BaseToolkit.description` | - | [packages/kernl/src/tool/toolkit.ts:165](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/tool/toolkit.ts#L165) |
| <a id="id"></a> `id` | `readonly` | `string` | Unique identifier for this toolkit | `BaseToolkit.id` | - | [packages/kernl/src/tool/toolkit.ts:164](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/tool/toolkit.ts#L164) |

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

Defined in: [packages/kernl/src/tool/toolkit.ts:245](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/tool/toolkit.ts#L245)

Cleanup resources and close the MCP server connection.

#### Returns

`Promise`\<`void`\>

#### Overrides

```ts
BaseToolkit.destroy
```

***

### get()

```ts
get(id: string): Tool<TContext> | undefined;
```

Defined in: [packages/kernl/src/tool/toolkit.ts:196](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/tool/toolkit.ts#L196)

Get a specific tool by ID.

Returns the tool from the local cache. The cache is populated on the first
call to list(). Returns undefined if list() hasn't been called yet.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | `string` | The tool ID to look up |

#### Returns

`Tool`\<`TContext`\> \| `undefined`

The tool if found in cache, undefined otherwise

#### Overrides

```ts
BaseToolkit.get
```

***

### list()

```ts
list(context?: Context<TContext>): Promise<Tool<TContext>[]>;
```

Defined in: [packages/kernl/src/tool/toolkit.ts:210](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/tool/toolkit.ts#L210)

List all tools available from the MCP server.

Connects to the server lazily on first call. Tools are cached locally after
the first fetch. The MCP server itself also handles caching via the
cacheToolsList option, so the network call is only made once.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `context?` | [`Context`](Context.md)\<`TContext`\> | Optional context for filtering tools |

#### Returns

`Promise`\<`Tool`\<`TContext`\>[]\>

Array of tools from the MCP server

#### Overrides

```ts
BaseToolkit.list
```
