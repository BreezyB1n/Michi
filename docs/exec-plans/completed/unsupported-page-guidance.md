# Unsupported Page Guidance Execution Plan

## Summary

Productize Michi recovery states for unsupported surfaces, route mismatch, missing expected targets, and runtime-read failures. The result should make blocked page checks actionable in both the React workbench and injected extension shell while preserving the compact product-only side-panel shape.

## Current Boundary

- The host page remains primary.
- Michi remains collapsed by default.
- Runtime readers and provider route IDs remain internal.
- Recovery remains a blocking phase.
- Command handoff remains the only forward path during recovery.
- No new permissions, storage, backend service, autonomous navigation, public listing work, or account writes.

## Design Thesis

- Visual thesis: compact recovery card, not a full troubleshooting page.
- Content thesis: what happened, why it blocks progress, what to do next.
- Safety thesis: recovery guidance cannot expose normal advance or completion while the page is blocked.

## Implementation Slices

### Slice 1: Spec And Planning

- [x] Add Unsupported Page Guidance PRD.
- [x] Add issue breakdown.
- [x] Add design decision.
- [x] Point execution status at this active plan.

### Slice 2: Shared Recovery Guidance

- [x] Add shared product-language recovery guidance presenter.
- [x] Add unit tests for unsupported surface, route mismatch, target missing, and runtime unavailable.
- [x] Keep provider-specific route IDs out of visible copy.

### Slice 3: React Recovery UI

- [x] Render guidance as a compact recovery card in the React side panel.
- [x] Preserve existing recover/re-check handler and focus lifecycle.
- [x] Add component tests for recovery copy and blocked command safety.

### Slice 4: Injected Shell Recovery UI

- [x] Render guidance in the injected shell shadow panel.
- [x] Keep command handoff and reset behavior unchanged.
- [x] Add shadow DOM tests for product-only recovery copy.

### Slice 5: Browser Proof And Review

- [x] Run focused tests, full tests, build, and browser proof.
- [x] Verify desktop/mobile no-horizontal-overflow behavior.
- [x] Verify unpacked extension runtime recovery guidance.
- [x] Run standard check wrapper and independent review before commit.
- [x] Run branch freshness gate after commit.

## Acceptance Criteria

- Unsupported-surface recovery explains what happened, why it blocks progress, and how to continue.
- Route mismatch recovery preserves the active guide path and does not silently switch paths.
- Missing-target recovery tells the user to wait, return to the expected step, and re-check.
- Runtime-read failure recovery explains that Michi could not read the page and should re-check/reload.
- Recovery phase does not expose normal advance, confirm, or completion as the forward action.
- React and injected shell show product-only recovery language.
- No manifest, permission, package, storage, backend, or account-write changes are introduced.

## Test Matrix

| Layer | Coverage |
| --- | --- |
| Unit | Recovery guidance presenter output and command safety during recovery. |
| Component | React recovery card copy, recover command, reset command, focus preservation. |
| Injected shell | Shadow DOM recovery card copy, command safety, product-only guard. |
| Browser | Desktop/mobile recovery guidance in React and unpacked extension runtime. |
| Merge gate | `git diff --check`, `npm test`, `npm run build`, `npm run test:e2e`, check wrapper, branch freshness. |

## Verification Ledger

| Command | Status | Notes |
| --- | --- | --- |
| `npm test -- tests/recoveryGuidance.test.ts` | Passed | RED failed on missing module, then GREEN passed with 4 recovery guidance classifications. |
| `npm test -- tests/App.test.tsx -t "renders productized missing-target recovery guidance"` | Passed | Review regression: React recovery card, command handoff, and activity history share productized missing-target guidance. |
| `npm test -- tests/injectedShell.test.ts -t "does not expose unsafe command handoff progress"` | Passed | Review regression: injected shell recovery hides normal previous, next, and completion controls. |
| `npm test -- tests/recoveryGuidance.test.ts tests/App.test.tsx tests/injectedShell.test.ts tests/commandHandoff.test.ts tests/productUiBoundary.test.ts tests/activityTimeline.test.ts tests/extensionGuideSessionBridge.test.ts` | Passed | Focused React, injected shell, command safety, activity, recovery guidance, reducer bridge, and product-copy guard: 96 tests passed. |
| `npm run build` | Passed | TypeScript and production Vite build passed. |
| `npm run test:e2e` | Passed | Browser proof covered React desktop/mobile recovery guidance and unpacked extension runtime guidance; 5 passed and 1 mobile extension-runtime test skipped by configuration. |
| `git diff --check` | Passed | Whitespace check passed. |
| `npm test` | Passed | Full unit/component suite passed: 24 files and 190 tests. |
| `bash /Users/bytedance/.agents/skills/check/scripts/run-tests.sh` | Passed | Standard check wrapper passed: 190 tests. |
| Independent subagent review | Passed | Runtime/UI and spec/test reviewers found injected-shell activity detail, React recovery status, and recovery-button copy issues; all were fixed and re-verified. |
| `npm run check:branch -- --strict-clean` | Passed | Branch was ahead 1, behind 0, dirty files 0, strict clean yes. |

## Rollback Plan

Revert the unsupported-page guidance branch. The slice only changes local presentation, derived recovery copy, docs, and tests, so rollback does not require data migration, permission cleanup, or account-state changes.
