# Product Surface Execution Plan

## Summary

Reframe the next frontend slice around Michi-owned UI regions. The visible shell now shows intent, guide step, page check, evidence, recovery, actions, and activity history. External workspace readers remain internal inputs and do not shape the product surface.

## Current Boundary

- Product shell copy stays in Michi language.
- Runtime readers and fixtures can stay implementation-specific.
- The host page remains primary; the panel stays compact.
- No new permissions, storage, analytics, account writes, or public listing flow.

## Implementation Slices

### Slice 1: Current Docs

- [x] Update current architecture and frontend docs to describe Michi product regions.
- [x] Add the Product Surface PRD, issue breakdown, and design decision.
- [x] Point execution status at this active plan.

### Slice 2: Activity Event Model

- [x] Add typed local activity events for session actions.
- [x] Add unit tests for event creation, ordering, and reset.

### Slice 3: Activity Timeline UI

- [x] Render a compact timeline inside the expanded React panel.
- [x] Render lightweight activity history inside the injected extension panel.
- [x] Keep mobile and desktop layouts within the current shell footprint.
- [x] Keep long activity details wrapped inside the compact panel.

### Slice 4: Guide Action Wiring

- [x] Create events from start, path choice, check, recover, confirm, complete, and reset.
- [x] Preserve critical confirmation safety.

### Slice 5: Browser Proof

- [x] Run focused component tests, full unit tests, build, and browser proof.
- [x] Verify no horizontal overflow and no provider-framed visible copy, including injected shadow-root copy.

## Acceptance Criteria

- Current-facing docs describe Michi as a product shell.
- Product surface tests reject provider-framed UI language in current docs and rendered shell copy.
- Activity history is deterministic, compact, and product-only.
- Existing guide, recovery, confirmation, and completion behavior remains intact.

## Verification Ledger

| Command | Status | Notes |
| --- | --- | --- |
| `npm test -- tests/activityTimeline.test.ts tests/App.test.tsx` | Passed | Activity event model plus React timeline flow and long-detail wrapping coverage. |
| `npm test -- tests/App.test.tsx tests/productUiBoundary.test.ts` | Passed | React long-detail wrapping plus current-facing docs/product boundary guard: 18 tests passed. |
| `npm test -- tests/injectedShell.test.ts` | Passed | Injected shell timeline parity: 31 tests passed. |
| `npx playwright test tests/e2e/michi-flow.spec.ts` | Passed | React browser smoke covers activity history, reset, product-only copy, and no horizontal overflow across desktop/mobile. |
| `npm run build:extension && npx playwright test tests/e2e/extension-runtime.spec.ts` | Passed | Unpacked extension smoke covers injected activity history and shadow-root product-only copy; 1 desktop test passed and mobile extension-runtime project skipped by configuration. |
| `npm test` | Passed | 22 files and 169 tests passed. |
| `npm run build` | Passed | TypeScript and production Vite build passed. |
| `npm run test:e2e` | Passed | 5 passed and 1 mobile extension-runtime test skipped by configuration. |
| `git diff --check` | Passed | No whitespace errors. |
| `bash /Users/bytedance/.agents/skills/check/scripts/run-tests.sh` | Passed | Standard check wrapper passed with 169 tests. |
| Independent subagent review | Addressed | Runtime/UI review flagged long activity detail wrapping; spec/test review flagged shadow-root copy and completed-plan boundary coverage. All three were fixed and verified. |

## Rollback Plan

Revert the activity timeline branch. The change is local UI/session state only: no storage, permissions, external services, account writes, or runtime reader contract changes.
