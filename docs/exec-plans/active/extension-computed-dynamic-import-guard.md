# Extension Computed Dynamic Import Guard Execution Plan

## Goal

Fail the extension permission guard when the extension source graph contains computed dynamic imports that cannot be statically scanned.

## Scope

- Product spec: `docs/product-specs/extension-computed-dynamic-import-guard.md`
- Decision record: `docs/design-docs/extension-computed-dynamic-import-guard-decision.md`
- Permission tests: `tests/extensionPermissionGuard.test.ts`
- Guard helper: `tests/support/extensionPermissionGuard.ts`
- Evidence ledger: this file

## Non-goals

- No extension runtime behavior change.
- No manifest, permission, storage, network, scripting, backend, or live Cloudflare change.
- No UI redesign.

## Tasks

- [x] Create stacked feature branch.
- [x] Add repo-local spec, execution plan, and decision record.
- [x] Add failing computed dynamic import guard regression.
- [x] Implement issue reporting in the guard helper.
- [x] Run focused tests, full unit/build/e2e, diff, `/check`, and subagent review.
- [x] Record verification evidence.

## Evidence Ledger

| Check | Result | Evidence | Caveat |
| --- | --- | --- | --- |
| `npm test -- tests/extensionPermissionGuard.test.ts` | Pass | RED 1: `dynamicImportIssues` was missing. RED 2: `import("./shared/" + moduleName, {})` was skipped. Final run: 1 file, 4 tests passed. | Guard is static and local; browser smoke is tracked separately. |
| `npm run build:extension` | Pass | Vite extension build completed; service worker and content script emitted. |  |
| `npm test` | Pass | 8 files, 46 tests passed. |  |
| `npm run build` | Pass | `tsc -b && vite build` completed successfully. |  |
| `npm run test:e2e` | Pass | Full Playwright suite: 3 passed, 1 skipped. | Extension runtime smoke is skipped on mobile project by design. |
| `git diff --check` | Pass | No whitespace errors. |  |
| `/check` review | Pass | `bash /Users/bytedance/.agents/skills/check/scripts/run-tests.sh` ran Vitest: 8 files, 46 tests passed. | Browser smoke is tracked separately above. |
| Security/permission subagent review | Pass | Initial review found a multi-argument dynamic import bypass; final review confirmed the bypass is resolved and no security/permission blockers remain. | No runtime or manifest permission surface changed. |
| Test/maintainability subagent review | Pass | Initial review found the same multi-argument dynamic import gap; final review confirmed fixture coverage and no test/maintainability blockers remain. |  |
