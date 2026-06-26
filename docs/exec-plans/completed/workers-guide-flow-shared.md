# Workers Guide Flow Shared State Execution Plan

## Goal

Move injected-shell Workers guide flow decisions into a shared domain helper without changing user-visible behavior.

## Scope

- Product spec: `docs/product-specs/workers-guide-flow-shared.md`
- Decision record: `docs/design-docs/workers-guide-flow-shared-decision.md`
- Domain helper: `src/domain/workersGuideFlow.ts`
- Injected shell integration: `src/extension/injectedShell.ts`
- Unit tests: `tests/workersGuideFlow.test.ts`, `tests/injectedShell.test.ts`
- Browser smoke: `tests/e2e/extension-runtime.spec.ts`
- Evidence ledger: this file

## Non-goals

- No React extension panel, new dependency, manifest change, permission change, storage, network call, or Cloudflare automation.

## Tasks

- [x] Create feature branch.
- [x] Add repo-local spec, execution plan, and decision record.
- [x] Add failing shared-flow unit tests.
- [x] Implement shared flow helper.
- [x] Refactor injected shell to use the helper.
- [x] Run focused tests, full unit/build/e2e, diff, `/check`, and subagent review.
- [x] Record verification evidence.

## Evidence Ledger

| Check | Result | Evidence | Caveat |
| --- | --- | --- | --- |
| `npm test -- tests/workersGuideFlow.test.ts tests/injectedShell.test.ts` | Pass | 2 files / 24 tests passed after extracting the helper. |  |
| `npm run build:extension && npx playwright test tests/e2e/extension-runtime.spec.ts --project=chromium` | Pass | Extension bundle built; Chromium unpacked-extension smoke passed. | Uses local fixture pages, not live Cloudflare. |
| `npm test` | Pass | 10 files / 63 tests passed. |  |
| `npm run build` | Pass | TypeScript project build and Vite production build completed. |  |
| `npm run test:e2e` | Pass | Playwright reported 3 passed, 1 skipped. | Mobile extension-runtime smoke remains skipped by project config. |
| `git diff --check` | Pass | Exit 0 with no whitespace errors. |  |
| `/check` review | Pass | `bash /Users/bytedance/.agents/skills/check/scripts/run-tests.sh` executed `npm test`; 10 files / 63 tests passed. | Standard-depth review; security specialist not activated because no auth, storage, network, file, shell, secret, or permission surface changed. |
| Frontend/runtime subagent review | Pass | No blockers. Reviewer verified page check, next/previous, confirmation, completion, target selection, and unsupported-page call sites. | Read-only review; verification executed by main agent. |
| Architecture/test subagent review | Pass | No blockers. Reviewer verified acceptance criteria and focused unit coverage; it also ran focused Vitest and `git diff --check`. | Read-only review; full build/e2e executed by main agent. |
