---
layout: docs
---

# Interface: RealtimeSessionOptions\<TContext\>

Defined in: [packages/kernl/src/realtime/types.ts:46](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/realtime/types.ts#L46)

Options for creating a realtime session.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TContext` | `UnknownContext` |

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="channel"></a> `channel?` | [`RealtimeChannel`](../../protocol/interfaces/RealtimeChannel.md) | Audio I/O channel (e.g., BrowserChannel, TwilioChannel). Not used with WebRTC transport. | [packages/kernl/src/realtime/types.ts:56](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/realtime/types.ts#L56) |
| <a id="connectoptions"></a> `connectOptions?` | [`RealtimeConnectOptions`](../../protocol/interfaces/RealtimeConnectOptions.md) | Options passed to model.connect() or transport.connect(). | [packages/kernl/src/realtime/types.ts:80](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/realtime/types.ts#L80) |
| <a id="context"></a> `context?` | [`Context`](../classes/Context.md)\<`TContext`\> | Context for this session. | [packages/kernl/src/realtime/types.ts:67](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/realtime/types.ts#L67) |
| <a id="credential"></a> `credential?` | [`ClientCredential`](../../protocol/type-aliases/ClientCredential.md) | Ephemeral credential for client-side connections. Obtained from model.authenticate() on the server. Shorthand for connectOptions.credential. | [packages/kernl/src/realtime/types.ts:75](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/realtime/types.ts#L75) |
| <a id="model"></a> `model?` | [`RealtimeModel`](../../protocol/interfaces/RealtimeModel.md) | Override the agent's default model for this session. | [packages/kernl/src/realtime/types.ts:50](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/realtime/types.ts#L50) |
| <a id="transport"></a> `transport?` | [`RealtimeTransport`](../../protocol/interfaces/RealtimeTransport.md) | Custom transport (e.g., WebRTCTransport). If not provided, model.connect() creates the default transport. | [packages/kernl/src/realtime/types.ts:62](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/realtime/types.ts#L62) |
