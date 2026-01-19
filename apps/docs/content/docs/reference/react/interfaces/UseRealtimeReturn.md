---
layout: docs
---

# Interface: UseRealtimeReturn

Defined in: [react/src/hooks/use-realtime.ts:43](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/react/src/hooks/use-realtime.ts#L43)

Return value from the useRealtime hook.

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="connect"></a> `connect` | (`credential`: [`CredentialInput`](../type-aliases/CredentialInput.md)) => `Promise`\<`void`\> | Connect to the realtime model with the given credential. | [react/src/hooks/use-realtime.ts:52](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/react/src/hooks/use-realtime.ts#L52) |
| <a id="disconnect"></a> `disconnect` | () => `void` | Disconnect from the realtime model. | [react/src/hooks/use-realtime.ts:57](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/react/src/hooks/use-realtime.ts#L57) |
| <a id="mute"></a> `mute` | () => `void` | Mute audio input. | [react/src/hooks/use-realtime.ts:67](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/react/src/hooks/use-realtime.ts#L67) |
| <a id="muted"></a> `muted` | `boolean` | Whether audio input is muted. | [react/src/hooks/use-realtime.ts:62](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/react/src/hooks/use-realtime.ts#L62) |
| <a id="sendmessage"></a> `sendMessage` | (`text`: `string`) => `void` | Send a text message to the model. | [react/src/hooks/use-realtime.ts:77](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/react/src/hooks/use-realtime.ts#L77) |
| <a id="status"></a> `status` | [`TransportStatus`](../../protocol/type-aliases/TransportStatus.md) | Current connection status. | [react/src/hooks/use-realtime.ts:47](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/react/src/hooks/use-realtime.ts#L47) |
| <a id="unmute"></a> `unmute` | () => `void` | Unmute audio input. | [react/src/hooks/use-realtime.ts:72](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/react/src/hooks/use-realtime.ts#L72) |
