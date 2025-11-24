# @kernl/protocol

## 0.2.4

### Patch Changes

- Migrate packages from GitHub Packages to npm registry.

  **Breaking change for `kernl` (formerly `@kernl-sdk/core`):**

  The core package has been renamed from `@kernl-sdk/core` to `kernl`. Update your imports:

  ```diff
  - import { Agent, Kernl } from "@kernl-sdk/core";
  + import { Agent, Kernl } from "kernl";
  ```

  All other packages remain under the `@kernl-sdk` scope and are now publicly available on npm.

- Updated dependencies
  - @kernl-sdk/shared@0.1.5

## 0.2.3

### Patch Changes

- Updated dependencies
  - @kernl-sdk/shared@0.1.4

## 0.2.2

### Patch Changes

- 2c62c0a: Migrate from @kernl to @kernl-sdk scope

  All packages have been migrated to the @kernl-sdk scope for publishing to GitHub Packages under the kernl-sdk organization.

- Updated dependencies [2c62c0a]
  - @kernl-sdk/shared@0.1.3

## 0.2.1

### Patch Changes

- Minor bug fixes and improvements
- Updated dependencies
  - @kernl-sdk/shared@0.1.2

## 0.2.0

### Minor Changes

- fffa89e: Add thread/task state constants and language model helper functions

## 0.1.1

### Patch Changes

- Initial release of Kernl AI agent framework with modular architecture
