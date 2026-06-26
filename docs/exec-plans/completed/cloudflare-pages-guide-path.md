# Cloudflare Pages Guide Path Execution Plan

## Goal

Promote static-site intent into a deterministic Cloudflare Pages guide path across the React workbench and injected extension shell, with local page anchoring and browser smoke coverage.

## Scope

- Product spec: `docs/product-specs/cloudflare-pages-guide-path.md`
- Decision record: `docs/design-docs/cloudflare-pages-guide-path-decision.md`
- Domain fixtures and reducer: `src/domain/siteSkillPack.ts`, `src/domain/guideSessionReducer.ts`
- Guide flow helpers: `src/domain/workersGuideFlow.ts`
- Page reader: `src/extension/cloudflarePageReader.ts`
- Injected shell bridge/UI: `src/extension/extensionGuideSessionBridge.ts`, `src/extension/injectedShell.ts`
- React workbench copy/controls: `src/App.tsx`
- Tests: reducer/core/page reader/flow helpers/shell bridge/injected shell/App/Playwright
- Evidence ledger: this file, moved to `completed/` when verified

## Non-goals

- No real Cloudflare account, Pages project creation, Git integration, file upload, network write, backend service, manifest permission expansion, or extension store packaging.

## Tasks

- [x] Create feature branch.
- [x] Add repo-local spec, execution plan, and decision record.
- [x] Add failing reducer/core tests for Pages guide routing, confirmation, and completion.
- [x] Add failing page-reader and flow-helper tests for Pages routes and targets.
- [x] Add failing React/injected-shell tests for Pages guide copy and local navigation.
- [x] Implement Pages skill pack data, reducer path selection, page reader detection, and bridge projection.
- [x] Add Playwright app smoke coverage for Pages path.
- [x] Run focused tests, full unit/build/e2e, diff, `/check`, and subagent review.
- [x] Record verification evidence and move this plan to `completed/`.

## Evidence Ledger

- `npm test -- tests/cloudflarePageReader.test.ts tests/injectedShell.test.ts tests/extensionGuideSessionBridge.test.ts` -> 3 files / 52 tests passed after review fixes.
- `npm test` -> 12 files / 109 tests passed.
- `npm run build` -> TypeScript build and Vite production bundle passed.
- `npm run test:e2e -- tests/e2e/extension-runtime.spec.ts --project=chromium` -> unpacked extension runtime smoke passed with Workers and Pages paths.
- `npm run test:e2e` -> 5 passed / 1 skipped. Desktop extension runtime smoke passed; mobile extension runtime smoke skipped by existing project guard.
- `git diff --check` -> passed with no output.
- `bash /Users/bytedance/.agents/skills/check/scripts/run-tests.sh` -> 12 files / 109 tests passed.
- Subagent code review found Pages page-reader route/signal edge cases; fixed with regression tests.
- Subagent release-risk review found missing unpacked extension Pages smoke and stale local base; fixed by adding extension runtime Pages coverage and fast-forwarding to current `origin/main`.

## Known Caveats

- None. This branch was fast-forwarded to the current `origin/main` before final verification.
