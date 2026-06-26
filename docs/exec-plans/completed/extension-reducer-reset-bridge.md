# Extension Reducer Reset Bridge Execution Plan

## Goal

Add a panel-level Reset action to the injected extension shell, backed by `guideSessionReducer`, without increasing the persistent rail footprint or changing host-page behavior.

## Scope

- Product spec: `docs/product-specs/extension-reducer-reset-bridge.md`
- Decision record: `docs/design-docs/extension-reducer-reset-bridge-decision.md`
- Bridge helper: `src/extension/extensionGuideSessionBridge.ts`
- Shell integration: `src/extension/injectedShell.ts`
- Unit/component tests: `tests/extensionGuideSessionBridge.test.ts`, `tests/injectedShell.test.ts`
- Browser smoke: existing Playwright extension runtime flow with reset assertions
- Evidence ledger: this file, moved to `completed/` when verified

## Non-goals

- No full `GuideSession` store, React extension panel, manifest change, permission change, storage, network call, backend service, Cloudflare automation, or rail expansion.

## Tasks

- [x] Create stacked feature branch.
- [x] Add repo-local spec, execution plan, and decision record.
- [x] Add failing reducer bridge and injected-shell reset tests.
- [x] Implement reducer-backed reset projection and panel Reset control.
- [x] Add browser smoke assertions for reset cleanup.
- [x] Run focused tests, full unit/build/e2e, diff, `/check`, and subagent review.
- [x] Record verification evidence and move this plan to `completed/`.

## Evidence Ledger

| Check | Result | Evidence | Caveat |
| --- | --- | --- | --- |
| `npm test -- tests/extensionGuideSessionBridge.test.ts tests/injectedShell.test.ts` | Pass | 2 files, 41 tests passed. | Includes RED/GREEN coverage for completed, active-guide, confirmation, static-site, recovery, and focus-after-reset paths. |
| `npm test` | Pass | 12 files, 93 tests passed. |  |
| `npm run build` | Pass | `tsc -b && vite build` completed. |  |
| `npm run test:e2e` | Pass | Playwright: 3 passed, 1 skipped. `pretest:e2e` built the extension bundle. | Existing mobile extension-runtime project remains skipped by test design. |
| `git diff --check` | Pass | No whitespace errors. |  |
| `/check` review | Pass | `bash /Users/bytedance/.agents/skills/check/scripts/run-tests.sh` completed via `npm test`: 12 files, 93 tests passed. |  |
| Spec/evidence subagent review | Pass after fixes | Initial review found stale active ledger and partial source-state coverage. Fixed with active/confirm/static reset tests and completed evidence ledger. | Read-only review; subagent could not run npm because its shell PATH lacked npm. |
| Frontend/runtime subagent review | Pass after fixes | No P0/P1/P2 findings. P3 focus loss after Reset fixed by focusing the intent textarea after reset render. | Read-only review; also verified rail footprint and permission boundary. |

## Known Caveats

- This branch is stacked on the reducer page-check bridge branch until the previous reducer bridge PRs land.
