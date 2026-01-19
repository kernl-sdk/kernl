---
layout: docs
---

# Class: MCPServerSSE

Defined in: [packages/kernl/src/mcp/sse.ts:22](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/mcp/sse.ts#L22)

MCP server client that communicates over Server-Sent Events (SSE).

## Extends

- `BaseMCPServer`

## Constructors

### Constructor

```ts
new MCPServerSSE(options: MCPServerSSEOptions): MCPServerSSE;
```

Defined in: [packages/kernl/src/mcp/sse.ts:31](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/mcp/sse.ts#L31)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | `MCPServerSSEOptions` |

#### Returns

`MCPServerSSE`

#### Overrides

```ts
BaseMCPServer.constructor
```

## Properties

| Property | Modifier | Type | Default value | Description | Overrides | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="_cachedirty"></a> `_cacheDirty` | `protected` | `boolean` | `true` | - | - | `BaseMCPServer._cacheDirty` | [packages/kernl/src/mcp/base.ts:88](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/mcp/base.ts#L88) |
| <a id="_cachedtools"></a> `_cachedTools` | `protected` | \| \{ `_meta?`: \{ \[`key`: `string`\]: `unknown`; \}; `annotations?`: \{ `destructiveHint?`: `boolean`; `idempotentHint?`: `boolean`; `openWorldHint?`: `boolean`; `readOnlyHint?`: `boolean`; `title?`: `string`; \}; `description?`: `string`; `execution?`: \{ `taskSupport?`: `"optional"` \| `"required"` \| `"forbidden"`; \}; `icons?`: \{ `mimeType?`: `string`; `sizes?`: `string`[]; `src`: `string`; `theme?`: `"light"` \| `"dark"`; \}[]; `inputSchema`: \{ \[`key`: `string`\]: `unknown`; `properties?`: \{ \[`key`: `string`\]: `object`; \}; `required?`: `string`[]; `type`: `"object"`; \}; `name`: `string`; `outputSchema?`: \{ \[`key`: `string`\]: `unknown`; `properties?`: \{ \[`key`: `string`\]: `object`; \}; `required?`: `string`[]; `type`: `"object"`; \}; `title?`: `string`; \}[] \| `undefined` | `undefined` | - | - | `BaseMCPServer._cachedTools` | [packages/kernl/src/mcp/base.ts:87](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/mcp/base.ts#L87) |
| <a id="cachetoolslist"></a> `cacheToolsList` | `public` | `boolean` | `undefined` | Whether to cache the tools list after first fetch. | - | `BaseMCPServer.cacheToolsList` | [packages/kernl/src/mcp/base.ts:84](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/mcp/base.ts#L84) |
| <a id="id"></a> `id` | `readonly` | `string` | `undefined` | - | `BaseMCPServer.id` | - | [packages/kernl/src/mcp/sse.ts:23](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/mcp/sse.ts#L23) |
| <a id="logger"></a> `logger` | `protected` | `Logger` | `undefined` | - | - | `BaseMCPServer.logger` | [packages/kernl/src/mcp/base.ts:86](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/mcp/base.ts#L86) |
| <a id="options"></a> `options` | `public` | `MCPServerSSEOptions` | `undefined` | - | - | - | [packages/kernl/src/mcp/sse.ts:28](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/mcp/sse.ts#L28) |
| <a id="serverinitializeresult"></a> `serverInitializeResult` | `protected` | \| \{ `capabilities`: \{ `tools`: `Record`\<`string`, `unknown`\>; \}; `protocolVersion`: `string`; `serverInfo`: \{ `name`: `string`; `version`: `string`; \}; \} \| `null` | `null` | - | - | - | [packages/kernl/src/mcp/sse.ts:26](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/mcp/sse.ts#L26) |
| <a id="session"></a> `session` | `protected` | \| `Client`\<\{ `method`: `string`; `params?`: \{ \[`key`: `string`\]: `unknown`; `_meta?`: \{ \[`key`: `string`\]: `unknown`; `io.modelcontextprotocol/related-task?`: \{ `taskId`: `string`; \}; `progressToken?`: `string` \| `number`; \}; \}; \}, \{ `method`: `string`; `params?`: \{ \[`key`: `string`\]: `unknown`; `_meta?`: \{ \[`key`: `string`\]: `unknown`; `io.modelcontextprotocol/related-task?`: \{ `taskId`: `string`; \}; `progressToken?`: `string` \| `number`; \}; \}; \}, \{ \[`key`: `string`\]: `unknown`; `_meta?`: \{ \[`key`: `string`\]: `unknown`; `io.modelcontextprotocol/related-task?`: \{ `taskId`: `string`; \}; `progressToken?`: `string` \| `number`; \}; \}\> \| `null` | `null` | - | - | - | [packages/kernl/src/mcp/sse.ts:24](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/mcp/sse.ts#L24) |
| <a id="timeout"></a> `timeout` | `protected` | `number` | `undefined` | - | - | - | [packages/kernl/src/mcp/sse.ts:25](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/mcp/sse.ts#L25) |
| <a id="toolfilter"></a> `toolFilter` | `public` | `MCPToolFilter` | `undefined` | Filter to control which tools are exposed to agents. Always a callable function. Defaults to allowing all tools. | - | `BaseMCPServer.toolFilter` | [packages/kernl/src/mcp/base.ts:85](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/mcp/base.ts#L85) |

## Methods

### \_listTools()

```ts
protected _listTools(): Promise<{
  _meta?: {
   [key: string]: unknown;
  };
  annotations?: {
     destructiveHint?: boolean;
     idempotentHint?: boolean;
     openWorldHint?: boolean;
     readOnlyHint?: boolean;
     title?: string;
  };
  description?: string;
  execution?: {
     taskSupport?: "optional" | "required" | "forbidden";
  };
  icons?: {
     mimeType?: string;
     sizes?: string[];
     src: string;
     theme?: "light" | "dark";
  }[];
  inputSchema: {
   [key: string]: unknown;
     properties?: {
      [key: string]: object;
     };
     required?: string[];
     type: "object";
  };
  name: string;
  outputSchema?: {
   [key: string]: unknown;
     properties?: {
      [key: string]: object;
     };
     required?: string[];
     type: "object";
  };
  title?: string;
}[]>;
```

Defined in: [packages/kernl/src/mcp/sse.ts:76](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/mcp/sse.ts#L76)

Internal implementation: Fetches tools from the server.

Cached via the BaseMCPServer class.

#### Returns

`Promise`\<\{
  `_meta?`: \{
   \[`key`: `string`\]: `unknown`;
  \};
  `annotations?`: \{
     `destructiveHint?`: `boolean`;
     `idempotentHint?`: `boolean`;
     `openWorldHint?`: `boolean`;
     `readOnlyHint?`: `boolean`;
     `title?`: `string`;
  \};
  `description?`: `string`;
  `execution?`: \{
     `taskSupport?`: `"optional"` \| `"required"` \| `"forbidden"`;
  \};
  `icons?`: \{
     `mimeType?`: `string`;
     `sizes?`: `string`[];
     `src`: `string`;
     `theme?`: `"light"` \| `"dark"`;
  \}[];
  `inputSchema`: \{
   \[`key`: `string`\]: `unknown`;
     `properties?`: \{
      \[`key`: `string`\]: `object`;
     \};
     `required?`: `string`[];
     `type`: `"object"`;
  \};
  `name`: `string`;
  `outputSchema?`: \{
   \[`key`: `string`\]: `unknown`;
     `properties?`: \{
      \[`key`: `string`\]: `object`;
     \};
     `required?`: `string`[];
     `type`: `"object"`;
  \};
  `title?`: `string`;
\}[]\>

#### Overrides

```ts
BaseMCPServer._listTools
```

***

### callTool()

```ts
callTool(toolName: string, args: Record<string, unknown> | null): Promise<{
  text: string;
  type: string;
}[]>;
```

Defined in: [packages/kernl/src/mcp/sse.ts:90](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/mcp/sse.ts#L90)

Executes a tool on the server with the provided arguments.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `toolName` | `string` |
| `args` | `Record`\<`string`, `unknown`\> \| `null` |

#### Returns

`Promise`\<\{
  `text`: `string`;
  `type`: `string`;
\}[]\>

#### Overrides

```ts
BaseMCPServer.callTool
```

***

### close()

```ts
close(): Promise<void>;
```

Defined in: [packages/kernl/src/mcp/sse.ts:118](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/mcp/sse.ts#L118)

Closes the connection and cleans up resources.

#### Returns

`Promise`\<`void`\>

#### Overrides

```ts
BaseMCPServer.close
```

***

### connect()

```ts
connect(): Promise<void>;
```

Defined in: [packages/kernl/src/mcp/sse.ts:46](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/mcp/sse.ts#L46)

Establishes connection to the MCP server.

#### Returns

`Promise`\<`void`\>

#### Overrides

```ts
BaseMCPServer.connect
```

***

### invalidateCache()

```ts
invalidateCache(): Promise<void>;
```

Defined in: [packages/kernl/src/mcp/base.ts:152](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/mcp/base.ts#L152)

Clears any cached tools, forcing a fresh fetch on next request.

#### Returns

`Promise`\<`void`\>

#### Inherited from

```ts
BaseMCPServer.invalidateCache
```

***

### listTools()

```ts
listTools(): Promise<{
  _meta?: {
   [key: string]: unknown;
  };
  annotations?: {
     destructiveHint?: boolean;
     idempotentHint?: boolean;
     openWorldHint?: boolean;
     readOnlyHint?: boolean;
     title?: string;
  };
  description?: string;
  execution?: {
     taskSupport?: "optional" | "required" | "forbidden";
  };
  icons?: {
     mimeType?: string;
     sizes?: string[];
     src: string;
     theme?: "light" | "dark";
  }[];
  inputSchema: {
   [key: string]: unknown;
     properties?: {
      [key: string]: object;
     };
     required?: string[];
     type: "object";
  };
  name: string;
  outputSchema?: {
   [key: string]: unknown;
     properties?: {
      [key: string]: object;
     };
     required?: string[];
     type: "object";
  };
  title?: string;
}[]>;
```

Defined in: [packages/kernl/src/mcp/base.ts:122](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/mcp/base.ts#L122)

Fetches the list of available tools from the server.
Handles caching and static filtering automatically.

#### Returns

`Promise`\<\{
  `_meta?`: \{
   \[`key`: `string`\]: `unknown`;
  \};
  `annotations?`: \{
     `destructiveHint?`: `boolean`;
     `idempotentHint?`: `boolean`;
     `openWorldHint?`: `boolean`;
     `readOnlyHint?`: `boolean`;
     `title?`: `string`;
  \};
  `description?`: `string`;
  `execution?`: \{
     `taskSupport?`: `"optional"` \| `"required"` \| `"forbidden"`;
  \};
  `icons?`: \{
     `mimeType?`: `string`;
     `sizes?`: `string`[];
     `src`: `string`;
     `theme?`: `"light"` \| `"dark"`;
  \}[];
  `inputSchema`: \{
   \[`key`: `string`\]: `unknown`;
     `properties?`: \{
      \[`key`: `string`\]: `object`;
     \};
     `required?`: `string`[];
     `type`: `"object"`;
  \};
  `name`: `string`;
  `outputSchema?`: \{
   \[`key`: `string`\]: `unknown`;
     `properties?`: \{
      \[`key`: `string`\]: `object`;
     \};
     `required?`: `string`[];
     `type`: `"object"`;
  \};
  `title?`: `string`;
\}[]\>

#### Inherited from

```ts
BaseMCPServer.listTools
```
