---
layout: docs
---

# Interface: RealtimeAgentConfig\<TContext\>

Defined in: [packages/kernl/src/realtime/types.ts:15](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/realtime/types.ts#L15)

Configuration for a realtime agent.

## Extends

- `BaseAgentConfig`\<`TContext`\>

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TContext` | `UnknownContext` |

## Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="description"></a> `description?` | `string` | - | `BaseAgentConfig.description` | [packages/kernl/src/agent/base.ts:25](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/agent/base.ts#L25) |
| <a id="id"></a> `id` | `string` | - | `BaseAgentConfig.id` | [packages/kernl/src/agent/base.ts:23](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/agent/base.ts#L23) |
| <a id="instructions"></a> `instructions` | \| `string` \| (`context`: [`Context`](../classes/Context.md)\<`TContext`\>) => `string` \| `Promise`\<`string`\> | - | `BaseAgentConfig.instructions` | [packages/kernl/src/agent/base.ts:26](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/agent/base.ts#L26) |
| <a id="memory"></a> `memory?` | `AgentMemoryConfig` | - | `BaseAgentConfig.memory` | [packages/kernl/src/agent/base.ts:30](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/agent/base.ts#L30) |
| <a id="model"></a> `model` | [`RealtimeModel`](../../protocol/interfaces/RealtimeModel.md) | The realtime model to use for this agent. | - | [packages/kernl/src/realtime/types.ts:20](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/realtime/types.ts#L20) |
| <a id="name"></a> `name` | `string` | - | `BaseAgentConfig.name` | [packages/kernl/src/agent/base.ts:24](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/agent/base.ts#L24) |
| <a id="toolkits"></a> `toolkits?` | `BaseToolkit`\<`TContext`\>[] | - | `BaseAgentConfig.toolkits` | [packages/kernl/src/agent/base.ts:29](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/agent/base.ts#L29) |
| <a id="voice"></a> `voice?` | [`RealtimeAgentVoiceConfig`](RealtimeAgentVoiceConfig.md) | Voice configuration for the agent. | - | [packages/kernl/src/realtime/types.ts:25](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/realtime/types.ts#L25) |
