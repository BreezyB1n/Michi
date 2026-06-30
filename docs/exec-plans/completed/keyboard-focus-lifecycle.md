# Keyboard Focus Lifecycle Execution Plan

## Summary

Add predictable keyboard focus movement to Michi's React workbench and injected extension shell. The panel should focus a useful control when opened, return focus to the rail when collapsed, preserve guide/page state on `Escape`, and focus the intent entry after reset.

## Current Boundary

- The side panel remains compact and collapsed by default.
- The host page remains primary.
- Guide state transitions remain owned by existing handlers and reducers.
- Visible copy stays in Michi product language.
- No global shortcuts, focus trap, manifest changes, permissions, storage, backend service, or account writes.

## Design Thesis

- Visual thesis: no new visible UI; keyboard behavior should make the existing compact UI feel more complete.
- Interaction thesis: focus should always land on the next useful Michi control after shell lifecycle actions.
- Safety thesis: focus movement must not mutate guide state or bypass confirmation/recovery.

## Implementation Slices

### Slice 1: Spec And Planning

- [x] Add Keyboard Focus Lifecycle PRD.
- [x] Add issue breakdown.
- [x] Add design decision.
- [x] Point execution status at this active plan.

### Slice 2: React Workbench Focus

- [x] Add failing component tests for open, minimize, `Escape`, and reset focus.
- [x] Implement React focus refs and scoped `Escape` collapse.
- [x] Keep session state intact after collapse.

### Slice 3: Injected Shell Focus

- [x] Add failing shadow DOM tests for open, minimize, `Escape`, and reset focus.
- [x] Implement injected-shell focus restoration after render.
- [x] Keep rail controls unchanged.

### Slice 4: Browser Proof And Review

- [x] Run focused tests, full tests, build, and browser proof.
- [x] Verify desktop and mobile no-horizontal-overflow behavior remains unchanged.
- [x] Run standard check wrapper and independent review before commit.
- [x] Run branch freshness gate after commit.

## Acceptance Criteria

- Opening Michi from the rail focuses the panel's current primary entry point.
- Collapsing from `Minimize panel` returns focus to rail `Guide`.
- Pressing `Escape` collapses an open panel without clearing guide or page-check state.
- Reset keeps the panel open and focuses the intent entry.
- React and injected shell both cover the lifecycle with tests.
- No new visible shortcut text, manifest permission, storage, or package changes are introduced.

## Test Matrix

| Layer | Coverage |
| --- | --- |
| Component | React focus after open, minimize, `Escape`, reset, and state preservation. |
| Injected shell | Shadow DOM focus after open, minimize, `Escape`, reset, and page-context preservation. |
| Browser | Desktop and mobile smoke for focus lifecycle and no horizontal overflow. |
| Merge gate | `git diff --check`, `npm test`, `npm run build`, `npm run test:e2e`, check wrapper, branch freshness. |

## Verification Ledger

| Command | Status | Notes |
| --- | --- | --- |
| `npm test -- tests/App.test.tsx -t "manages keyboard focus"` | Passed | RED failed on rail focus, then GREEN passed after React focus lifecycle implementation. |
| `npm test -- tests/injectedShell.test.ts -t "restores focus"` | Passed | RED failed with no shadow active element, then GREEN passed after injected-shell focus restoration. |
| `npm test -- tests/App.test.tsx tests/injectedShell.test.ts tests/productUiBoundary.test.ts` | Passed | Focused React, injected shell, and product-copy guard: 55 tests passed. |
| `npm run build` | Passed | TypeScript and production Vite build passed. |
| `npm run test:e2e` | Passed | Browser proof covered React workbench and unpacked extension focus assertions; 5 passed and 1 mobile extension-runtime test skipped by configuration. |
| `git diff --check` | Passed | Whitespace check passed. |
| `npm test` | Passed | Full unit/component suite passed: 23 files and 184 tests. |
| `bash /Users/bytedance/.agents/skills/check/scripts/run-tests.sh` | Passed | Standard check wrapper passed: 184 tests. |
| Independent subagent review | Passed | Spec/test review found no blockers; runtime review findings were addressed with scoped Escape and focus-regression coverage. |
| `npm run check:branch -- --strict-clean` | Passed | Branch ready: ahead 1, behind 0, dirty files 0, strict clean yes. |

## Rollback Plan

Revert the keyboard focus lifecycle branch. The slice only changes local UI focus behavior and tests, so rollback does not require data migration, permission cleanup, or account-state changes.
