# Extension Runtime Error Surface Execution Plan

## Goal

Make extension runtime/provider failures visible and recoverable in Michi's guide UI.

## Scope

- Product spec: `docs/product-specs/extension-runtime-error-surface.md`
- Decision record: `docs/design-docs/extension-runtime-error-surface-decision.md`
- Domain behavior: `src/domain/guideCore.ts`, `src/domain/extensionPageContextProvider.ts`
- Shared signal helper: `src/domain/pageContextSignals.ts`
- UI behavior: `src/App.tsx`
- Browser smoke: `tests/e2e/extension-runtime.spec.ts`
- Unit/component tests: `tests/serviceWorker.test.ts`, `tests/extensionPageContextProvider.test.ts`, `tests/guideCore.test.ts`, `tests/App.test.tsx`
- Evidence ledger: this file

## Non-goals

- No new extension permissions, storage, network calls, background polling, automatic page actions, or live Cloudflare automation.
- No redesign of the shell or injected panel.
- No production marketplace packaging.

## Tasks

- [x] Create stacked feature branch.
- [x] Add repo-local spec, execution plan, and decision record.
- [x] Add failing provider/domain/UI/browser assertions.
- [x] Implement runtime error recovery state.
- [x] Run focused tests, full unit/build/e2e, diff, `/check`, and subagent review.
- [x] Record verification evidence.

## Evidence Ledger

| Check | Result | Evidence | Caveat |
| --- | --- | --- | --- |
| `npm test -- tests/serviceWorker.test.ts tests/extensionPageContextProvider.test.ts tests/guideCore.test.ts tests/App.test.tsx` | Pass | 4 files, 27 tests passed. | Focused runtime/domain/UI regression suite. |
| `npm run build:extension && npx playwright test tests/e2e/extension-runtime.spec.ts --project=chromium` | Pass | Extension build passed; Chromium extension smoke 1 passed. | Uses a temporary extension-page probe in `dist-extension` to exercise service-worker runtime messaging. |
| `npm test` | Pass | 9 files, 52 tests passed. |  |
| `npm run build` | Pass | `tsc -b && vite build`; 76 modules transformed. |  |
| `npm run test:e2e` | Pass | 3 passed, 1 skipped. | Mobile extension runtime smoke skips by design; desktop extension runtime smoke runs. |
| `git diff --check` | Pass | Exit 0, no output. |  |
| `/check` review | Pass | `run-tests.sh` executed `npm test`; 9 files, 52 tests passed. | Diff classified as deep due file count; specialist findings addressed. |
| Product/runtime subagent review | Pass after fixes | Found stale async provider overwrite and host status mismatch; fixed with request-id guard, rejected/sync failure normalization, and session-derived status. |  |
| Security/permission subagent review | Pass after fixes | No permission/storage/network/polling issues; requested service-worker normalization coverage, added `tests/serviceWorker.test.ts`. |  |
| Architecture/API subagent review | Pass after fixes | Requested service-worker E2E boundary, thunk-based runtime seam, shared signal helper, and ledger update; all addressed. |  |
