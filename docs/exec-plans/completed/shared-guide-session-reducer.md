# Shared Guide Session Reducer Execution Plan

## Goal

Move React workbench `GuideSession` transition logic into a pure shared reducer without changing visible UI behavior.

## Scope

- Product spec: `docs/product-specs/shared-guide-session-reducer.md`
- Decision record: `docs/design-docs/shared-guide-session-reducer-decision.md`
- Reducer: `src/domain/guideSessionReducer.ts`
- Compatibility facade: `src/domain/guideCore.ts`
- Unit tests: `tests/guideSessionReducer.test.ts`, `tests/guideCore.test.ts`
- Browser smoke: existing Playwright app and extension flows
- Evidence ledger: this file

## Non-goals

- No React extension panel, injected shell rewrite, new dependency, manifest change, permission change, storage, network call, backend service, or Cloudflare automation.

## Tasks

- [x] Create stacked feature branch.
- [x] Add repo-local spec, execution plan, and decision record.
- [x] Add failing reducer tests.
- [x] Implement reducer and refactor `GuideCore` wrappers.
- [x] Run focused tests, full unit/build/e2e, diff, `/check`, and subagent review.
- [x] Record verification evidence.

## Evidence Ledger

| Check | Result | Evidence | Caveat |
| --- | --- | --- | --- |
| `npm test -- tests/guideSessionReducer.test.ts tests/guideCore.test.ts` | Pass | 2 files / 22 tests passed after adding reducer, static-site, and immutability coverage. | RED first failed because `guideSessionReducer` did not exist. |
| `npm test` | Pass | 11 files / 72 tests passed. |  |
| `npm run build` | Pass | TypeScript project build and Vite production build completed. |  |
| `npm run test:e2e` | Pass | Playwright reported 3 passed, 1 skipped. | Mobile extension-runtime smoke remains skipped by project config. |
| `npx playwright test tests/e2e/extension-runtime.spec.ts --project=chromium --repeat-each=5` | Pass | 5 repeated Chromium unpacked-extension smoke runs passed after stabilizing scroll-highlight polling. | Uses local fixture pages, not live Cloudflare. |
| `git diff --check` | Pass | Exit 0 with no whitespace errors. |  |
| `/check` review | Pass | `bash /Users/bytedance/.agents/skills/check/scripts/run-tests.sh` executed `npm test`; 11 files / 72 tests passed. | Standard-depth review; security specialist not activated because no auth, storage, network, file, shell, secret, or permission surface changed. |
| Frontend/runtime subagent review | Pass | No blockers. Reviewer verified React still uses `guideCore` wrappers, extension shell still uses `workersGuideFlow`, and browser evidence covers workbench and extension flows. | Read-only review. |
| Architecture/test subagent review | Pass after fixes | Initial review found pending evidence rows, missing static-site reducer coverage, and missing immutability coverage. Fixed with reducer tests and this ledger update. | Read-only review; no file edits from subagent. |
