# Extension Runtime Probe Boundary Execution Plan

## Goal

Separate runtime probe/setup support from the unpacked extension E2E smoke so the browser proof remains focused on Michi's user-visible extension behavior.

## Stack Note

This branch is intentionally based on `origin/codex/michi-extension-fixture-boundary` because the target E2E file already depends on the extracted Cloudflare dashboard fixture support from that slice. Rebase onto `main` after fixture-boundary lands.

## Scope

- Product spec: `docs/product-specs/extension-runtime-probe-boundary.md`
- Decision record: `docs/design-docs/extension-runtime-probe-boundary-decision.md`
- Runtime support: `tests/support/extensionRuntimeHarness.ts`
- Unit tests: `tests/extensionRuntimeHarness.test.ts`
- E2E smoke: `tests/e2e/extension-runtime.spec.ts`

## Non-goals

- No extension manifest, permission, service worker, content script, guide reducer, or UI behavior changes.
- No Chrome Web Store packaging or real Cloudflare automation.
- No new app dependency.
- No broad Playwright fixture framework.

## Tasks

- [x] Create stacked branch from `origin/codex/michi-extension-fixture-boundary`.
- [x] Add product spec, decision record, and active execution plan.
- [x] Add RED unit tests for runtime probe/setup support.
- [x] Implement runtime probe/setup support module.
- [x] Refactor extension runtime E2E to use the support module.
- [x] Run focused unit and desktop runtime smoke tests.
- [x] Run full frontend merge gate and check.
- [x] Complete review and move this plan to `completed/` with evidence.

## Evidence Ledger

- `npm test -- tests/extensionRuntimeHarness.test.ts` -> RED failed because `tests/support/extensionRuntimeHarness.ts` did not exist.
- `npm test -- tests/extensionRuntimeHarness.test.ts` -> 1 file / 3 tests passed after extracting runtime probe/setup support.
- `npm run build:extension && npm run test:e2e -- tests/e2e/extension-runtime.spec.ts --project=chromium` -> extension build passed and desktop unpacked extension runtime smoke passed.
- `npm test` -> 14 files / 126 tests passed.
- `npm run build` -> TypeScript build and Vite production bundle passed.
- `npm run test:e2e` -> 5 passed / 1 skipped. The unpacked extension runtime smoke passed on desktop Chromium; mobile extension runtime smoke remains skipped by the existing project guard.
- `git diff --check` -> passed with no output.
- `bash /Users/bytedance/.agents/skills/check/scripts/run-tests.sh` -> 14 files / 126 tests passed.
- Subagent review found the new harness/spec files were not staged yet, which would make the branch artifact incomplete. Fixed by staging all new files before commit.
- Post-review `npm test && npm run build && npm run test:e2e && git diff --check --cached && bash /Users/bytedance/.agents/skills/check/scripts/run-tests.sh` -> 14 files / 126 tests passed, build passed, e2e 5 passed / 1 skipped, cached diff check passed.
