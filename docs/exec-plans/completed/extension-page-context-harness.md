# Extension Page Context Harness Execution Plan

## Goal

Extract active-tab page-context reads from the unpacked extension E2E smoke into the runtime harness, keeping the browser proof focused on Michi's visible extension behavior.

## Stack Note

This branch is intentionally based on `codex/michi-extension-runtime-probe-boundary`. Rebase onto `main` after the fixture and runtime-probe boundary slices land.

## Scope

- Product spec: `docs/product-specs/extension-page-context-harness.md`
- Decision record: `docs/design-docs/extension-page-context-harness-decision.md`
- Runtime support: `tests/support/extensionRuntimeHarness.ts`
- Unit tests: `tests/extensionRuntimeHarness.test.ts`
- E2E smoke: `tests/e2e/extension-runtime.spec.ts`

## Non-goals

- No extension manifest, permission, service worker, content script, guide reducer, or UI behavior changes.
- No Chrome Web Store packaging or real Cloudflare automation.
- No new app dependency.
- No broad Playwright fixture framework.

## Tasks

- [x] Create stacked branch from `codex/michi-extension-runtime-probe-boundary`.
- [x] Add product spec, decision record, and active execution plan.
- [x] Add RED unit tests for active-tab page-context harness support.
- [x] Implement page-context harness support.
- [x] Refactor extension runtime E2E to use the support helper.
- [x] Run focused unit and desktop runtime smoke tests.
- [x] Run full frontend merge gate and check.
- [x] Complete review and move this plan to `completed/` with evidence.

## Evidence Ledger

- `npm test -- tests/extensionRuntimeHarness.test.ts` -> RED failed because `buildPageContextRequestMessage` and `requestPageContextFromActiveTab` were not implemented yet.
- `npm test -- tests/extensionRuntimeHarness.test.ts` -> 1 file / 6 tests passed after adding page-context request helper support.
- `npm run build:extension && npm run test:e2e -- tests/e2e/extension-runtime.spec.ts --project=chromium` -> extension build passed and desktop unpacked extension runtime smoke passed.
- `npm test` -> 14 files / 130 tests passed.
- `npm run build` -> TypeScript build and Vite production bundle passed.
- `npm run test:e2e` -> 5 passed / 1 skipped. The unpacked extension runtime smoke passed on desktop Chromium; mobile extension runtime smoke remains skipped by the existing project guard.
- `git diff --check` -> passed with no output.
- `git diff --check --cached` -> passed with no output after staging the new docs.
- `bash /Users/bytedance/.agents/skills/check/scripts/run-tests.sh` -> 14 files / 130 tests passed.
- Subagent review found that `chrome.tabs.query()` can return `[]`, which produced a generic `TypeError`. Added a RED empty-active-tab test, fixed the helper to use `activeTab?.id`, and reran `npm test -- tests/extensionRuntimeHarness.test.ts` -> 1 file / 7 tests passed.
- Subagent review also noted that untracked docs are not covered by plain `git diff --check`; final evidence includes staged diff whitespace verification.
