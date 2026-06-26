# Extension Permission Guard Execution Plan

## Goal

Add automated guardrails that keep Michi's extension runtime Cloudflare-only and read-only.

## Scope

- Product spec: `docs/product-specs/extension-permission-guard.md`
- Decision record: `docs/design-docs/extension-permission-guard-decision.md`
- Permission tests: `tests/extensionPermissionGuard.test.ts`
- Manifest contract: `extension/public/manifest.json`
- Extension runtime source graph: `src/extension/contentScript.ts`, `src/extension/serviceWorker.ts`, and their relative imports
- Evidence ledger: this file

## Non-goals

- No new extension permissions, storage, network calls, scripting APIs, backend service, or live Cloudflare automation.
- No UI redesign or behavior change.
- No production marketplace packaging.

## Tasks

- [x] Create stacked feature branch.
- [x] Add repo-local spec, execution plan, and decision record.
- [x] Add failing permission-boundary regression tests.
- [x] Implement minimal test helpers until the guard passes.
- [x] Run focused tests, full unit/build/e2e, diff, `/check`, and subagent review.
- [x] Record verification evidence.

## Evidence Ledger

| Check | Result | Evidence | Caveat |
| --- | --- | --- | --- |
| `npm test -- tests/extensionPermissionGuard.test.ts` | Pass | RED 1: missing helper produced import-resolution failure. RED 2: graph fixture reported missing `scannedFiles`. RED 3: dynamic relative import was not traversed. Final run: 1 file, 3 tests passed. | Guard is static and local; it does not prove live Cloudflare dashboard behavior. |
| `npm run build:extension` | Pass | Vite extension build completed; service worker and content script emitted. |  |
| `npm test` | Pass | 8 files, 45 tests passed. |  |
| `npm run build` | Pass | `tsc -b && vite build` completed successfully. |  |
| `npm run test:e2e` | Pass | Full Playwright suite: 3 passed, 1 skipped. | Extension runtime smoke is skipped on mobile project by design. |
| `git diff --check` | Pass | No whitespace errors. |  |
| `/check` review | Pass | `bash /Users/bytedance/.agents/skills/check/scripts/run-tests.sh` ran Vitest: 8 files, 45 tests passed. | Browser smoke is tracked separately above. |
| Security/permission subagent review | Pass | Initial review found entry graph, forbidden spelling, optional permission, and dynamic import gaps. Follow-up review confirmed blockers resolved; no remaining security/permission blocker. | Non-blocking option: computed dynamic imports are not traversed and should be banned or resolved if introduced later. |
| Test/maintainability subagent review | Pass | Initial review found `window.fetch` false negative and missing scanner fixture coverage. Follow-up review confirmed scanner/test issues resolved. | Reviewer noted untracked files before staging; addressed during final staging. |
