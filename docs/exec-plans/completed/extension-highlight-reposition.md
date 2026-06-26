# Extension Highlight Reposition Execution Plan

## Goal

Keep the injected extension shell's target highlight aligned with the host-page target after scroll and resize.

## Scope

- Product spec: `docs/product-specs/extension-highlight-reposition.md`
- Decision record: `docs/design-docs/extension-highlight-reposition-decision.md`
- UI/runtime behavior: `src/extension/injectedShell.ts`
- Unit tests: `tests/injectedShell.test.ts`
- Browser smoke: `tests/e2e/extension-runtime.spec.ts`
- Evidence ledger: this file

## Non-goals

- No timers, polling, MutationObserver, storage, new permissions, network calls, automatic page actions, or non-Cloudflare support.

## Tasks

- [x] Create stacked feature branch.
- [x] Add repo-local spec, execution plan, and decision record.
- [x] Add failing unit/E2E assertions for scroll and resize highlight refresh.
- [x] Implement event-driven context refresh in the injected shell.
- [x] Run focused tests, full unit/build/e2e, diff, `/check`, and subagent review.
- [x] Record verification evidence.

## Evidence Ledger

| Check | Result | Evidence | Caveat |
| --- | --- | --- | --- |
| `npm test -- tests/injectedShell.test.ts` | Pass | 1 file, 17 tests passed. | Includes RED/GREEN coverage for window scroll, nested container scroll, resize, phase preservation, and unmount cleanup. |
| `npm run build:extension && npx playwright test tests/e2e/extension-runtime.spec.ts --project=chromium` | Pass | Extension build passed; Chromium extension smoke 1 passed. | Browser smoke verifies window and nested-scroll highlight movement. |
| `npm test` | Pass | 9 files, 56 tests passed. |  |
| `npm run build` | Pass | `tsc -b && vite build`; 76 modules transformed. |  |
| `npm run test:e2e` | Pass | 3 passed, 1 skipped. | Mobile extension runtime smoke skips by design; desktop extension runtime smoke runs. |
| `git diff --check` | Pass | Exit 0, no output. |  |
| `/check` review | Pass | `run-tests.sh` executed `npm test`; 9 files, 56 tests passed. |  |
| Frontend/runtime subagent review | Pass after fixes | Found missing nested-scroll handling and brittle missing-highlight assertion; fixed with document capture scroll, nested-scroll unit/E2E coverage, and strict highlight visibility checks. |  |
| Security/permission subagent review | Pass | No P0/P1/P2 security or permission issues. Residual P3s addressed or documented by event-driven scope and unmount cleanup. |  |
