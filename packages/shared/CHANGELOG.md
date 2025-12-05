# @kernl/shared

## 0.3.0

### Minor Changes

- 2b0993d: Add `nextCursor` getter to `CursorPage` for accessing the pagination cursor without fetching the next page

## 0.2.0

### Minor Changes

- Add CursorPageParams and pagination types

## 0.1.6

### Patch Changes

- Fix ESM compatibility by adding --resolve-full-paths to tsc-alias build

## 0.1.5

### Patch Changes

- Migrate packages from GitHub Packages to npm registry.

  **Breaking change for `kernl` (formerly `@kernl-sdk/core`):**

  The core package has been renamed from `@kernl-sdk/core` to `kernl`. Update your imports:

  ```diff
  - import { Agent, Kernl } from "@kernl-sdk/core";
  + import { Agent, Kernl } from "kernl";
  ```

  All other packages remain under the `@kernl-sdk` scope and are now publicly available on npm.

## 0.1.4

### Patch Changes

- fix: ensure UnimplementedError is properly exported from lib/error

## 0.1.3

### Patch Changes

- 2c62c0a: Migrate from @kernl to @kernl-sdk scope

  All packages have been migrated to the @kernl-sdk scope for publishing to GitHub Packages under the kernl-sdk organization.

## 0.1.2

### Patch Changes

- Minor bug fixes and improvements

## 0.1.1

### Patch Changes

- Initial release of Kernl AI agent framework with modular architecture
