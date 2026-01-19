---
layout: docs
---

# Type Alias: ClientCredential

```ts
type ClientCredential = 
  | {
  expiresAt: Date;
  kind: "token";
  token: string;
}
  | {
  expiresAt: Date;
  kind: "url";
  url: string;
};
```

Defined in: [packages/protocol/src/realtime/types.ts:368](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/types.ts#L368)

A client credential for browser-based realtime connections.

Created server-side via model.authenticate(), passed to client
for secure connection without exposing API keys.

## Type Declaration

```ts
{
  expiresAt: Date;
  kind: "token";
  token: string;
}
```

| Name | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| `expiresAt` | `Date` | - | [packages/protocol/src/realtime/types.ts:373](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/types.ts#L373) |
| `kind` | `"token"` | Ephemeral token for auth header (OpenAI style). | [packages/protocol/src/realtime/types.ts:371](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/types.ts#L371) |
| `token` | `string` | - | [packages/protocol/src/realtime/types.ts:372](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/types.ts#L372) |

```ts
{
  expiresAt: Date;
  kind: "url";
  url: string;
}
```

| Name | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| `expiresAt` | `Date` | - | [packages/protocol/src/realtime/types.ts:379](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/types.ts#L379) |
| `kind` | `"url"` | Signed URL to connect directly (ElevenLabs style). | [packages/protocol/src/realtime/types.ts:377](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/types.ts#L377) |
| `url` | `string` | - | [packages/protocol/src/realtime/types.ts:378](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/realtime/types.ts#L378) |
