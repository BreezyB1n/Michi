# Extension Route State Guard Execution Plan

## Goal

Prevent active injected-shell guide sessions from silently switching between Workers and Pages when `Check page` reads a route from the other Cloudflare product path.

## Scope

- Product spec: `docs/product-specs/extension-route-state-guard.md`
- Decision record: `docs/design-docs/extension-route-state-guard-decision.md`
- Bridge: `src/extension/extensionGuideSessionBridge.ts`
- Shell recovery copy: `src/extension/injectedShell.ts`
- Tests: `tests/extensionGuideSessionBridge.test.ts`, `tests/injectedShell.test.ts`, and targeted browser smoke if the visible behavior changes

## Non-goals

- No new guide capability.
- No manifest or permission change.
- No real Cloudflare automation, storage, backend, or account writes.
- No redesign of the rail or panel.

## Tasks

- [x] Create feature branch from current `origin/main`.
- [x] Add product spec, decision record, and active execution plan.
- [x] Add RED bridge tests for Workers -> Pages and Pages -> Workers cross-path checks.
- [x] Add RED shell test for visible route-mismatch recovery copy.
- [x] Implement the minimal route-state guard and recovery evidence.
- [x] Run focused tests, full unit/build/e2e, diff check, `/check`, and subagent review.
- [x] Record evidence and move this plan to `completed/`.

## Evidence Ledger

- `npm test -- tests/extensionGuideSessionBridge.test.ts tests/injectedShell.test.ts` -> 2 files / 53 tests passed after review fixes.
- `npm run test:e2e -- tests/e2e/extension-runtime.spec.ts --project=chromium` -> unpacked extension runtime smoke passed with route mismatch, dynamic `history.pushState` URL reads, and selected-path recovery.
- `npm test` -> 12 files / 118 tests passed.
- `npm run build` -> TypeScript build and Vite production bundle passed.
- `npm run test:e2e` -> 5 passed / 1 skipped. Desktop extension runtime smoke passed; mobile extension runtime smoke skipped by existing project guard.
- `git diff --check` -> passed with no output.
- `bash /Users/bytedance/.agents/skills/check/scripts/run-tests.sh` -> 12 files / 118 tests passed.
- Subagent runtime review found confirm-state cross-path checks still preserved stale confirmation; fixed with bridge tests and blocking-context projection.
- Subagent release-risk review found route-mismatch recovery could highlight the wrong-path target; fixed by suppressing highlights when checked route kind differs from selected `serviceKind`.

## Known Caveats

- None. This branch was created from the current `origin/main`, which already contains the Cloudflare Pages guide path.
