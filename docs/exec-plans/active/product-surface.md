# Product Surface Execution Plan

## Summary

Reframe the next frontend slice around Michi-owned UI regions. The visible shell should show intent, guide step, page check, evidence, recovery, actions, and activity history. External workspace readers remain internal inputs and must not shape the product surface.

## Current Boundary

- Product shell copy stays in Michi language.
- Runtime readers and fixtures can stay implementation-specific.
- The host page remains primary; the panel stays compact.
- No new permissions, storage, analytics, account writes, or public listing flow.

## Implementation Slices

### Slice 1: Current Docs

- Update current architecture and frontend docs to describe Michi product regions.
- Add the Product Surface PRD, issue breakdown, and design decision.
- Point execution status at this active plan.

### Slice 2: Activity Event Model

- Add typed local activity events for session actions.
- Add unit tests for event creation, ordering, and reset.

### Slice 3: Activity Timeline UI

- Render a compact timeline inside the expanded panel.
- Keep mobile and desktop layouts within the current shell footprint.

### Slice 4: Guide Action Wiring

- Create events from start, path choice, check, recover, confirm, complete, and reset.
- Preserve critical confirmation safety.

### Slice 5: Browser Proof

- Run focused component tests, full unit tests, build, and browser proof.
- Verify no horizontal overflow and no provider-framed visible copy.

## Acceptance Criteria

- Current-facing docs describe Michi as a product shell.
- Product surface tests reject provider-framed UI language in current docs and rendered shell copy.
- Activity history is deterministic, compact, and product-only.
- Existing guide, recovery, confirmation, and completion behavior remains intact.

## Verification Ledger

| Command | Status | Notes |
| --- | --- | --- |
| `npm test -- tests/productUiBoundary.test.ts` | Passed | Current docs, product surface docs, and active plan guard. |
| `npm test` | Passed | 21 files and 163 tests passed. |
| `npm run build` | Passed | TypeScript and production Vite build passed. |
| `npm run test:e2e` | Passed | 5 passed and 1 mobile extension-runtime test skipped by configuration. |
| `git diff --check` | Passed | No whitespace errors. |
| `bash /Users/bytedance/.agents/skills/check/scripts/run-tests.sh` | Passed | Standard check wrapper passed. |

## Rollback Plan

Revert this active plan and related current-doc updates. No runtime behavior changes are included in Slice 1.
