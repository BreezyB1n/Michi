# Extension Reducer Intent Bridge Execution Plan

## Goal

Use the shared guide-session reducer for injected-shell intent start and service-kind choice actions without changing visible extension shell behavior.

## Scope

- Product spec: `docs/product-specs/extension-reducer-intent-bridge.md`
- Decision record: `docs/design-docs/extension-reducer-intent-bridge-decision.md`
- Bridge helper: `src/extension/extensionGuideSessionBridge.ts`
- Shell integration: `src/extension/injectedShell.ts`
- Unit tests: `tests/extensionGuideSessionBridge.test.ts`, `tests/injectedShell.test.ts`
- Browser smoke: existing Playwright extension runtime flow
- Evidence ledger: this file

## Non-goals

- No React extension panel, full shell migration, new dependency, manifest change, permission change, storage, network call, backend service, or Cloudflare automation.

## Tasks

- [x] Create stacked feature branch.
- [x] Add repo-local spec, execution plan, and decision record.
- [x] Add failing bridge tests.
- [x] Implement bridge helper and refactor injected shell event handlers.
- [x] Run focused tests, full unit/build/e2e, diff, `/check`, and subagent review.
- [x] Record verification evidence.

## Evidence Ledger

| Check | Result | Evidence | Caveat |
| --- | --- | --- | --- |
| `npm test -- tests/extensionGuideSessionBridge.test.ts tests/injectedShell.test.ts` | Pass | 2 files, 22 tests passed. | Covers reducer bridge and injected shell backend/static choice wiring. |
| `npm test` | Pass | 12 files, 77 tests passed. |  |
| `npm run build` | Pass | `tsc -b && vite build` completed. |  |
| `npm run test:e2e` | Pass | Playwright: 3 passed, 1 skipped. `pretest:e2e` built the extension bundle. | Existing mobile extension-runtime project remains skipped. |
| `git diff --check` | Pass | No whitespace errors. |  |
| `/check` review | Pass | `bash /Users/bytedance/.agents/skills/check/scripts/run-tests.sh` completed via `npm test`: 12 files, 77 tests passed. |  |
| Frontend/runtime subagent review | Pass | No blocking findings and no P3+ issues after static-site DOM coverage. | Read-only review. |
| Architecture/test subagent review | Pass | No blocking findings and no P3+ issues after clarify guard and exhaustive service-kind projection. | Read-only review. |
