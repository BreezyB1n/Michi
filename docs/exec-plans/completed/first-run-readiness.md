# First-Run Readiness Execution Plan

## Summary

Add a compact first-run readiness checklist to Michi's React workbench and injected shell. The checklist should make the first-open state legible without expanding the product footprint or adding onboarding persistence.

## Current Boundary

- The host page remains primary.
- Michi remains collapsed by default.
- Readiness is informational; command handoff remains the action surface.
- Runtime readers and route IDs remain internal.
- No new permissions, storage, backend service, analytics, public listing work, autonomous navigation, or account writes.

## Design Thesis

- Visual thesis: checklist note, not onboarding wizard.
- Content thesis: panel active, page check available, guide state ready, page usable or needs recovery.
- Safety thesis: readiness cannot bypass recovery, confirmation, or page-check gating.

## Implementation Slices

### Slice 1: Spec And Planning

- [x] Add First-Run Readiness PRD.
- [x] Add issue breakdown.
- [x] Add design decision.
- [x] Point execution status at this active plan.

### Slice 2: Shared Readiness Presenter

- [x] Add shared readiness item types and presenter.
- [x] Add unit tests for ready, needs-check, blocked, and active-guide states.
- [x] Keep provider-specific route IDs out of visible copy.

### Slice 3: React First-Run UI

- [x] Render readiness in the first-open side panel.
- [x] Preserve intent input focus and command handoff.
- [x] Add component tests for first-open, checked, and blocked readiness states.

### Slice 4: Injected Shell First-Run UI

- [x] Render readiness in the shadow panel before guide start.
- [x] Preserve Check handoff into the guide and hide first-run readiness afterward.
- [x] Add shadow DOM tests for first-open and checked-page readiness.

### Slice 5: Browser Proof And Review

- [x] Run focused tests, full tests, build, and browser proof.
- [x] Verify desktop/mobile no-horizontal-overflow behavior.
- [x] Verify unpacked runtime readiness in the injected shell.
- [x] Run standard check wrapper and independent review before commit.
- [x] Run branch freshness gate after commit.

## Acceptance Criteria

- Opening Michi shows a compact readiness checklist and intent entry.
- Page check availability is visible without exposing runtime implementation details.
- Local guide-state safety is visible before starting a guide.
- Checked usable surfaces show ready/usable state.
- Blocked/recovery surfaces show readiness warning without normal progress actions.
- React and injected shell use aligned product-language readiness copy.
- No manifest, permission, package, storage, backend, analytics, or account-write changes are introduced.

## Test Matrix

| Layer | Coverage |
| --- | --- |
| Unit | Readiness presenter classifications and product copy. |
| Component | React first-open checklist, focus preservation, checked/blocked updates. |
| Injected shell | Shadow DOM readiness on open and Check handoff into the guide. |
| Browser | Desktop/mobile first-open readiness and unpacked runtime readiness. |
| Merge gate | `git diff --check`, `npm test`, `npm run build`, `npm run test:e2e`, check wrapper, branch freshness. |

## Verification Ledger

| Command | Status | Notes |
| --- | --- | --- |
| `npm test -- tests/readiness.test.ts` | Passed | Shared readiness presenter tests: 7 passed, including unchecked extension placeholder, runtime failure, and first-run recovery states. |
| `npm test -- tests/readiness.test.ts tests/App.test.tsx tests/injectedShell.test.ts tests/productUiBoundary.test.ts` | Passed | Focused UI/product-copy coverage: 4 files / 67 tests passed after review fixes. |
| `npm run build` | Passed | TypeScript and production Vite build passed. |
| `npm run test:e2e` | Passed | Browser proof passed: 5 passed and 1 mobile extension-runtime smoke skipped by configuration; first-run overflow is checked while the checklist is still visible. |
| `git diff --check` | Passed | No whitespace errors. |
| `npm test` | Passed | Full unit/component suite: 25 files / 200 tests passed. |
| `bash /Users/bytedance/.agents/skills/check/scripts/run-tests.sh` | Passed | Standard check wrapper passed with 25 files / 200 tests. |
| Independent subagent review | Addressed | Review found overclaimed first-run overflow proof and incorrect initial extension placeholder recovery copy; fixed with earlier overflow assertions, injected-shell recovery readiness coverage, and needs-check placeholder classification. |
| `npm run check:branch -- --strict-clean` | Passed | Branch `codex/michi-first-run-readiness` is ahead 1, behind 0, clean, and ready. |

## Review Notes

- Initial extension placeholder contexts now show `Page needs check`; only checked runtime failures or blocked surfaces show `Page needs recovery`.
- Injected-shell first-run recovery readiness is limited to checked recovery before any guide has started, so completed or active guide recovery does not reintroduce first-run onboarding.
- Browser proof now checks no horizontal overflow while the first-run checklist is visible, not only after the guide starts.

## Rollback Plan

Revert the first-run readiness branch. The slice only changes local presentation, derived checklist copy, docs, and tests, so rollback does not require data migration, permission cleanup, or account-state changes.
