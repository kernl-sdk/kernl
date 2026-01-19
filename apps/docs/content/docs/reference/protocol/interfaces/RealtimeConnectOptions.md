---
layout: docs
---

# Interface: RealtimeConnectOptions

Defined in: [packages/protocol/src/realtime/types.ts:40](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/types.ts#L40)

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="abort"></a> `abort?` | `AbortSignal` | Abort signal for cancelling connection. | [packages/protocol/src/realtime/types.ts:54](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/types.ts#L54) |
| <a id="credential"></a> `credential?` | [`ClientCredential`](../type-aliases/ClientCredential.md) | Ephemeral credential for client-side connections. Obtained from model.authenticate() on the server. When provided, used instead of the model's API key. | [packages/protocol/src/realtime/types.ts:67](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/types.ts#L67) |
| <a id="provideroptions"></a> `providerOptions?` | [`SharedProviderOptions`](../type-aliases/SharedProviderOptions.md) | Provider-specific options. | [packages/protocol/src/realtime/types.ts:59](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/types.ts#L59) |
| <a id="resume"></a> `resume?` | [`SessionResumeConfig`](SessionResumeConfig.md) | Resume a previous session. | [packages/protocol/src/realtime/types.ts:49](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/types.ts#L49) |
| <a id="sessionconfig"></a> `sessionConfig?` | [`RealtimeSessionConfig`](RealtimeSessionConfig.md) | Initial session configuration. | [packages/protocol/src/realtime/types.ts:44](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/types.ts#L44) |
| <a id="websocket"></a> `websocket?` | [`WebSocketConstructor`](../type-aliases/WebSocketConstructor.md) | WebSocket constructor for browser/Node compatibility. Defaults to globalThis.WebSocket (available in browsers and Node 22+). For Node.js <22, provide the 'ws' package. **Example** `import WebSocket from 'ws'; await model.connect({ websocket: WebSocket });` | [packages/protocol/src/realtime/types.ts:81](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/types.ts#L81) |
