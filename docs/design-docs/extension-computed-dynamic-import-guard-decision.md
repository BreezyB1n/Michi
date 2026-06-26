# Extension Computed Dynamic Import Guard Decision

## Decision

Ban non-literal dynamic imports in Michi's extension entry dependency graph by reporting them from the permission guard.

## Context

The permission guard can follow static imports, re-exports, and literal relative dynamic imports. A computed dynamic import can still be included in the extension bundle by Vite, but the guard cannot know which source files to inspect. For a Cloudflare-only/read-only extension runtime, an unscanned module is a permission-boundary gap.

## Rationale

- Failing closed is safer than pretending a computed import was scanned.
- Single-argument literal relative dynamic imports cover the intentional code-splitting case; all other dynamic imports fail closed.
- The guard stays local to tests and does not affect extension runtime behavior.
- Future work that truly needs computed imports must update the spec and add a more explicit resolver or ban exception.

## Consequences

- Extension runtime code cannot use computed dynamic imports without failing tests.
- The permission guard gives a specific file, line, and snippet for remediation.
- Browser smoke remains the runtime proof, while the guard remains the static permission proof.

## Rollback

Remove the computed dynamic import issue reporting and the fixture assertion. The rest of the permission guard continues to scan static and literal dynamic imports.
