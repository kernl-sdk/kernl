---
layout: docs
---

# Interface: RealtimeModel

Defined in: [packages/protocol/src/realtime/model.ts:28](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/model.ts#L28)

A realtime model that can establish bidirectional streaming connections.

Models are reusable - each call to connect() creates a new connection.
Providers implement this interface.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="modelid"></a> `modelId` | `readonly` | `string` | Model ID (e.g., "gpt-4o-realtime", "gemini-2.0-flash"). | [packages/protocol/src/realtime/model.ts:42](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/model.ts#L42) |
| <a id="provider"></a> `provider` | `readonly` | `string` | Provider ID (e.g., "openai", "google", "elevenlabs"). | [packages/protocol/src/realtime/model.ts:37](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/model.ts#L37) |
| <a id="spec"></a> `spec` | `readonly` | `"1.0"` | The realtime model spec version. | [packages/protocol/src/realtime/model.ts:32](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/model.ts#L32) |

## Methods

### authenticate()

```ts
authenticate(options?: RealtimeAuthenticateOptions): Promise<ClientCredential>;
```

Defined in: [packages/protocol/src/realtime/model.ts:57](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/model.ts#L57)

Create ephemeral credential for client-side connections.

Call server-side where API key is available, pass result to client.
Client then uses credential in connect() options.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`RealtimeAuthenticateOptions`](RealtimeAuthenticateOptions.md) | Provider-specific options (e.g., agentId for ElevenLabs) |

#### Returns

`Promise`\<[`ClientCredential`](../type-aliases/ClientCredential.md)\>

***

### connect()

```ts
connect(options?: RealtimeConnectOptions): Promise<RealtimeConnection>;
```

Defined in: [packages/protocol/src/realtime/model.ts:47](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/model.ts#L47)

Establish a connection and return a connection instance.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options?` | [`RealtimeConnectOptions`](RealtimeConnectOptions.md) |

#### Returns

`Promise`\<[`RealtimeConnection`](RealtimeConnection.md)\>
