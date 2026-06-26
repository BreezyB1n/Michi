# Extension Computed Dynamic Import Guard

## Summary

Michi's extension permission guard follows the extension entry dependency graph. Literal relative dynamic imports can be resolved and scanned, but computed dynamic imports cannot. This slice treats computed dynamic imports in extension runtime source as a permission-guard violation so future code cannot hide unscanned runtime modules behind expressions.

## Goals

- Report non-literal dynamic imports in the extension entry dependency graph.
- Keep literal relative dynamic imports supported and scanned.
- Keep the actual extension runtime unchanged.
- Preserve the existing Cloudflare-only/read-only manifest and forbidden API guard.

## Non-goals

- No runtime bundler change, code-splitting strategy change, new dependency, extension permission, storage, network call, or live Cloudflare automation.
- No UI behavior change.
- No attempt to resolve arbitrary computed import expressions.

## UX Behavior

There is no new visible UI. The user-facing guarantee is that Michi's extension bundle remains statically inspectable by the permission guard before browser smoke runs.

## Acceptance Criteria

- The permission guard reports computed dynamic imports such as `import("./shared/" + name)`.
- The permission guard reports any dynamic import that is not a single literal relative specifier, including `import("./shared/" + name, {})`.
- The current extension entry graph has zero computed dynamic import issues.
- Literal relative dynamic imports such as `import("./shared/dynamic")` remain scanned.
- Existing extension build and browser smoke still pass.

## Test Requirements

- `npm test -- tests/extensionPermissionGuard.test.ts`
- `npm run build:extension`
- `npm test`
- `npm run build`
- `npm run test:e2e`
- `git diff --check`
