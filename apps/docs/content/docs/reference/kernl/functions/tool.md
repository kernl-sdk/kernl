---
layout: docs
---

# Function: tool()

```ts
function tool<TContext, TParameters, TResult>(config: ToolConfig<TContext, TParameters, TResult>): FunctionTool<TContext, TParameters, TResult>;
```

Defined in: [packages/kernl/src/tool/tool.ts:34](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/tool/tool.ts#L34)

Exposes a function to the agent as a tool to be called

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TContext` | `unknown` |
| `TParameters` *extends* `ToolInputParameters` | `undefined` |
| `TResult` | `string` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `config` | `ToolConfig`\<`TContext`, `TParameters`, `TResult`\> | The options for the tool |

## Returns

`FunctionTool`\<`TContext`, `TParameters`, `TResult`\>

A new tool instance
