---
layout: docs
---

# Interface: WebSocketTransportOptions

Defined in: [packages/kernl/src/realtime/transport.ts:12](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/realtime/transport.ts#L12)

Options for creating a WebSocket transport.

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="websocket"></a> `websocket?` | [`WebSocketConstructor`](../../protocol/type-aliases/WebSocketConstructor.md) | WebSocket constructor to use. Required in Node.js <22 (provide the 'ws' package). Optional in browsers and Node.js 22+ (uses globalThis.WebSocket). **Example** `import WebSocket from 'ws'; new WebSocketTransport({ websocket: WebSocket });` | [packages/kernl/src/realtime/transport.ts:25](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/realtime/transport.ts#L25) |
