---
layout: docs
---

# Class: ModelRegistry

Defined in: [packages/kernl/src/kernl/registry.ts:12](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/kernl/registry.ts#L12)

Registry for language models used by threads.

Models are keyed by "{provider}/{modelId}" and must be registered before
storage can hydrate threads that reference them.

## Implements

- [`IModelRegistry`](../interfaces/IModelRegistry.md)

## Constructors

### Constructor

```ts
new ModelRegistry(): ModelRegistry;
```

#### Returns

`ModelRegistry`

## Methods

### get()

```ts
get(key: string): 
  | LanguageModel
  | undefined;
```

Defined in: [packages/kernl/src/kernl/registry.ts:28](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/kernl/registry.ts#L28)

Get a model by its composite key ("{provider}/{modelId}").

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `string` |

#### Returns

  \| [`LanguageModel`](../../protocol/interfaces/LanguageModel.md)
  \| `undefined`

#### Implementation of

[`IModelRegistry`](../interfaces/IModelRegistry.md).[`get`](../interfaces/IModelRegistry.md#get)

***

### register()

```ts
register(model: LanguageModel): void;
```

Defined in: [packages/kernl/src/kernl/registry.ts:18](https://github.com/kernl-sdk/kernl/blob/91f1cdb0bdd9506521d48da419c35fdb4b5a7eab/packages/kernl/src/kernl/registry.ts#L18)

Register a model instance. Idempotent - only adds if not already present.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `model` | [`LanguageModel`](../../protocol/interfaces/LanguageModel.md) |

#### Returns

`void`
