# Extension Reducer Page Check Bridge Execution Plan

## Goal

Use the shared guide-session reducer for injected-shell page-check projection, including page drift recovery and recovery-to-guide return, without changing visible extension shell behavior.

## Scope

- Product spec: `docs/product-specs/extension-reducer-page-check-bridge.md`
- Decision record: `docs/design-docs/extension-reducer-page-check-bridge-decision.md`
- Bridge helper: `src/extension/extensionGuideSessionBridge.ts`
- Shell integration: `src/extension/injectedShell.ts`
- Domain cleanup: `src/domain/workersGuideFlow.ts`
- Unit/component tests: `tests/extensionGuideSessionBridge.test.ts`, `tests/injectedShell.test.ts`, `tests/workersGuideFlow.test.ts`, `tests/guideSessionReducer.test.ts`
- Browser smoke: existing Playwright extension runtime flow
- Evidence ledger: this file

## Non-goals

- No React extension panel, full shell state migration, manifest change, permission change, storage, network call, backend service, Cloudflare automation, or visual redesign.

## Tasks

- [x] Create stacked feature branch.
- [x] Add repo-local spec, execution plan, and decision record.
- [x] Add failing reducer bridge tests for page check, page drift recovery, recovered context, and unsupported context projection.
- [x] Implement reducer-backed page-check helper and refactor injected shell check handler.
- [x] Run focused tests, full unit/build/e2e, diff, `/check`, and subagent review.
- [x] Record verification evidence.

## Evidence Ledger

| Check | Result | Evidence | Caveat |
| --- | --- | --- | --- |
| `npm test -- tests/extensionGuideSessionBridge.test.ts tests/injectedShell.test.ts tests/workersGuideFlow.test.ts tests/guideSessionReducer.test.ts` | Pass | 4 files, 47 tests passed. | Includes regressions for pending confirmation plus later route and same-route missing target. |
| `npm test` | Pass | 12 files, 86 tests passed. |  |
| `npm run build` | Pass | `tsc -b && vite build` completed. |  |
| `npm run test:e2e` | Pass | Playwright: 3 passed, 1 skipped. `pretest:e2e` built the extension bundle. | Existing mobile extension-runtime project remains skipped by test design. |
| `git diff --check` | Pass | No whitespace errors. |  |
| `/check` review | Pass | `bash /Users/bytedance/.agents/skills/check/scripts/run-tests.sh` completed via `npm test`: 12 files, 86 tests passed. |  |
| Frontend/runtime subagent review | Pass | Initial stale-confirmation finding fixed; final review reported no blocking findings and no P2+ issues. | Read-only review. |
| Architecture/test subagent review | Pass | Initial pending-confirmation re-anchor finding fixed; final review reported no blocking findings and no P2+ issues. | Read-only review. |

## Known Caveats

- Extension runtime E2E still skips the mobile extension-runtime project, matching the existing test fixture behavior.
- The bridge preserves pending critical confirmation on later checked routes, and only moves confirm state into recovery when the same expected route is missing the expected target.
