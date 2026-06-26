# Extension Reducer Flow Bridge Execution Plan

## Goal

Use the shared guide-session reducer for injected-shell previous, next, critical confirmation, and completion projections without changing visible extension shell behavior.

## Scope

- Product spec: `docs/product-specs/extension-reducer-flow-bridge.md`
- Decision record: `docs/design-docs/extension-reducer-flow-bridge-decision.md`
- Bridge helper: `src/extension/extensionGuideSessionBridge.ts`
- Shell integration: `src/extension/injectedShell.ts`
- Domain cleanup: `src/domain/workersGuideFlow.ts`
- Unit/component tests: `tests/extensionGuideSessionBridge.test.ts`, `tests/injectedShell.test.ts`, `tests/workersGuideFlow.test.ts`
- Browser smoke: existing Playwright extension runtime flow
- Evidence ledger: this file

## Non-goals

- No React extension panel, full shell state migration, manifest change, permission change, storage, network call, backend service, Cloudflare automation, or visual redesign.

## Tasks

- [x] Create stacked feature branch.
- [x] Add repo-local spec, execution plan, and decision record.
- [x] Add failing reducer bridge tests for previous, next, confirmation, and completion projection.
- [x] Implement reducer-backed bridge helpers and refactor injected shell event handlers.
- [x] Run focused tests, full unit/build/e2e, diff, `/check`, and subagent review.
- [x] Record verification evidence.

## Evidence Ledger

| Check | Result | Evidence | Caveat |
| --- | --- | --- | --- |
| `npm test -- tests/guideSessionReducer.test.ts tests/extensionGuideSessionBridge.test.ts tests/injectedShell.test.ts tests/workersGuideFlow.test.ts` | Pass | 4 files, 40 tests passed. | Focused reducer/bridge/shell/page-anchoring coverage. |
| `npm test` | Pass | 12 files, 79 tests passed. |  |
| `npm run build` | Pass | `tsc -b && vite build` completed. |  |
| `npm run test:e2e` | Pass | Playwright: 3 passed, 1 skipped. `pretest:e2e` built the extension bundle. | Existing mobile extension-runtime project remains skipped by test design. |
| `git diff --check` | Pass | No whitespace errors. |  |
| `/check` review | Pass | `bash /Users/bytedance/.agents/skills/check/scripts/run-tests.sh` completed via `npm test`: 12 files, 79 tests passed. |  |
| Frontend/runtime subagent review | Pass | No blocking findings and no actionable regressions. | Read-only review; noted completion bridge must keep canonical `canCompleteWorkersGuide` gate. |
| Architecture/test subagent review | Pass | No blocking findings. | Read-only review; requested ledger update and direct reducer `previous` coverage, both addressed. |

## Known Caveats

- Extension runtime E2E still skips the mobile extension-runtime project, matching the existing test fixture behavior.
- `completeGuideFromReducer` accepts a caller-supplied completion boolean; injected shell passes only `canCompleteWorkersGuide(state.context, state.activeStepIndex)` in this slice.
