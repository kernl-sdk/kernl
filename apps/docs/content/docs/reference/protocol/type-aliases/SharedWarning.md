---
layout: docs
---

# Type Alias: SharedWarning

```ts
type SharedWarning = 
  | {
  details?: string;
  feature: string;
  type: "unsupported";
}
  | {
  details?: string;
  feature: string;
  type: "compatibility";
}
  | {
  message: string;
  type: "other";
};
```

Defined in: [packages/protocol/src/language-model/model.ts:181](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/model.ts#L181)

Warning from the model provider for this call. The call will proceed, but e.g.
some settings might not be supported, which can lead to suboptimal results.

## Type Declaration

```ts
{
  details?: string;
  feature: string;
  type: "unsupported";
}
```

| Name | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| `details?` | `string` | Additional details about the warning. | [packages/protocol/src/language-model/model.ts:196](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/model.ts#L196) |
| `feature` | `string` | The feature that is not supported. | [packages/protocol/src/language-model/model.ts:191](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/model.ts#L191) |
| `type` | `"unsupported"` | A feature is not supported by the model. | [packages/protocol/src/language-model/model.ts:186](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/model.ts#L186) |

```ts
{
  details?: string;
  feature: string;
  type: "compatibility";
}
```

| Name | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| `details?` | `string` | Additional details about the warning. | [packages/protocol/src/language-model/model.ts:212](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/model.ts#L212) |
| `feature` | `string` | The feature that is used in compatibility mode. | [packages/protocol/src/language-model/model.ts:207](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/model.ts#L207) |
| `type` | `"compatibility"` | A compatibility feature is used that might lead to suboptimal results. | [packages/protocol/src/language-model/model.ts:202](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/model.ts#L202) |

```ts
{
  message: string;
  type: "other";
}
```

| Name | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| `message` | `string` | The message of the warning. | [packages/protocol/src/language-model/model.ts:223](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/model.ts#L223) |
| `type` | `"other"` | Other warning. | [packages/protocol/src/language-model/model.ts:218](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/protocol/src/language-model/model.ts#L218) |
