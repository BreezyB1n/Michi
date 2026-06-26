# Extension Injected Guide Navigation Execution Plan

## Goal

Add local guide-path navigation to Michi's injected extension shell so users can browse Workers guide steps after checking the page.

## Scope

- Product spec: `docs/product-specs/extension-injected-guide-navigation.md`
- Decision record: `docs/design-docs/extension-injected-guide-navigation-decision.md`
- Injected shell UI: `src/extension/injectedShell.ts`
- Tests: `tests/injectedShell.test.ts`, `tests/e2e/extension-runtime.spec.ts`
- Evidence ledger: this file

## Non-goals

- No host-page mutation.
- No production Chrome Web Store packaging.
- No real Cloudflare write automation.
- No new permissions or browser storage.
- No full React content-script runtime.

## Tasks

- [x] Confirm current branch and rebase onto latest `origin/main`.
- [x] Add repo-local spec, execution plan, and decision record.
- [x] Add failing tests for local Previous/Next guide step navigation.
- [x] Implement deterministic local guide-step state in the injected shell.
- [x] Run unit, build, e2e, and diff checks.
- [x] Record verification evidence.
- [x] Run final `/check` review.

## Evidence Ledger

| Check | Result | Evidence | Caveat |
| --- | --- | --- | --- |
| `npm test` | Pass | 7 files passed, 35 tests passed. | Ran with `/Users/bytedance/.local/bin/npm` and bundled Node on PATH because the default shell PATH did not expose `npm`. |
| `npm run build` | Pass | TypeScript build and Vite production build completed. | Same PATH caveat as above. |
| `npm run test:e2e` | Pass | 3 passed, 1 skipped. Chromium unpacked-extension smoke passed; mobile extension-runtime remains intentionally skipped. | Same PATH caveat as above. |
| `git diff --check` | Pass | Exit code 0. |  |
| `/check` review | Pass | Standard review: scope on target, no hard stops, no new permissions/storage, security scan found no new exploitable path, `check/scripts/run-tests.sh` exited 0. | Same PATH caveat as above. |
