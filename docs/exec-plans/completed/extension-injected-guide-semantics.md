# Extension Injected Guide Semantics Execution Plan

## Goal

Complete the frontend guide semantics for Michi's injected extension shell so the page-attached panel explains the current Workers guide step after a page check.

## Scope

- Product spec: `docs/product-specs/extension-injected-guide-semantics.md`
- Injected shell UI: `src/extension/injectedShell.ts`
- Tests: `tests/injectedShell.test.ts`, `tests/e2e/extension-runtime.spec.ts`
- Evidence ledger: this file

## Non-goals

- No production Chrome Web Store packaging.
- No real Cloudflare write automation.
- No new permissions.
- No browser storage.
- No full React content-script runtime.

## Tasks

- [x] Audit current frontend specs and shell behavior.
- [x] Add repo-local spec and execution plan.
- [x] Add failing tests for guide semantics in the injected shell.
- [x] Implement deterministic route-to-guide-step rendering.
- [x] Run unit, build, e2e, and diff checks.
- [x] Record verification evidence.
- [x] Run final `/check` review.

## Evidence Ledger

| Check | Result | Evidence | Caveat |
| --- | --- | --- | --- |
| `npm test` | Pass | 7 files passed, 34 tests passed. | Ran with `/Users/bytedance/.local/bin/npm` and bundled Node on PATH because the default shell PATH did not expose `npm`. |
| `npm run build` | Pass | TypeScript build and Vite production build completed. | Same PATH caveat as above. |
| `npm run test:e2e` | Pass | 3 passed, 1 skipped. Chromium unpacked-extension smoke passed; mobile extension-runtime remains intentionally skipped. | Same PATH caveat as above. |
| `git diff --check` | Pass | Exit code 0. |  |
| `/check` review | Pass | Standard review: scope on target, no hard stops, architecture decision documented, security scan found no new exploitable path. `check/scripts/run-tests.sh` exited 0. | The default shell PATH did not expose `npm`/`npx`, so the verifier ran with `/Users/bytedance/.local/bin` and bundled Node on PATH. |
