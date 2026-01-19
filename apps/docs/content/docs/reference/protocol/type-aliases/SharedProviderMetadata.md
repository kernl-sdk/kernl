---
layout: docs
---

# Type Alias: SharedProviderMetadata

```ts
type SharedProviderMetadata = Record<string, JSONObject>;
```

Defined in: [packages/protocol/src/provider/provider.ts:77](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/provider/provider.ts#L77)

Additional provider-specific metadata.

They are passed through to the provider from the AI SDK
and enable provider-specific functionality
that can be fully encapsulated in the provider.

The outer record is keyed by the provider name, and the inner
record is keyed by the provider-specific metadata key.

```ts
{
  "anthropic": {
    "cacheControl": { "type": "ephemeral" }
  }
}
```
