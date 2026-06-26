# Extension Permission Guard Decision

## Decision

Protect Michi's extension boundary with static regression tests instead of relying on manual review alone.

## Context

The extension runtime is intentionally narrow: one MV3 manifest, one Cloudflare dashboard content-script match, no storage, no network calls, and no scripting permission. Recent slices added stronger page-state and unsupported-page behavior, and the independent security review found no current permission issue but noted the lack of automated permission-regression coverage.

## Rationale

- Permission drift is easy to miss in UI-focused work.
- Static tests are cheap, deterministic, and run in the normal Vitest suite.
- Scanning the extension entry dependency graph is stricter than scanning only `src/extension`, because extension entry files can import shared runtime modules through static or dynamic relative imports.
- The guard matches the current product phase: local deterministic guide shell first, real automation later only through a new spec.
- The test should block broadening the extension surface before review, not after a browser smoke.

## Consequences

- Future work that needs storage, network, scripting, or broader host access must update the spec and tests deliberately.
- The guard does not replace browser smoke; it only protects the declared extension boundary.
- The extension remains Cloudflare-only and read-only for this milestone.

## Rollback

Remove the permission guard test and this decision record. The runtime behavior remains unchanged, but permission drift would return to manual review coverage.
