# Extension Runtime Fixture Boundary Execution Plan

## Goal

Separate Cloudflare dashboard fixture generation from the unpacked extension runtime smoke so runtime assertions remain focused on extension behavior instead of embedded demo HTML.

## Scope

- Product spec: `docs/product-specs/extension-runtime-fixture-boundary.md`
- Decision record: `docs/design-docs/extension-runtime-fixture-boundary-decision.md`
- Fixture support: `tests/support/cloudflareDashboardFixture.ts`
- Fixture tests: `tests/cloudflareDashboardFixture.test.ts`
- E2E smoke: `tests/e2e/extension-runtime.spec.ts`

## Non-goals

- No runtime behavior, content script, service worker, manifest, permission, guide reducer, or injected-shell changes.
- No new Cloudflare guide capability or route.
- No real Cloudflare account or live network dependency.

## Tasks

- [x] Create feature branch from `origin/main`.
- [x] Add product spec, decision record, and active execution plan.
- [x] Add RED fixture tests for the extracted route variants.
- [x] Implement the Cloudflare dashboard fixture support module.
- [x] Replace inline e2e route HTML with the support module.
- [x] Run focused fixture and extension-runtime smoke tests.
- [x] Run full verification and `check`.
- [x] Complete subagent review and address findings.
- [x] Move this plan to `completed/` with evidence.

## Evidence Ledger

- `npm test -- tests/cloudflareDashboardFixture.test.ts` -> RED failed first because `tests/support/cloudflareDashboardFixture.ts` did not exist.
- `npm test -- tests/cloudflareDashboardFixture.test.ts` -> 1 file / 5 tests passed after fixture extraction.
- `npm run test:e2e -- tests/e2e/extension-runtime.spec.ts --project=chromium` -> extension build passed and desktop unpacked extension runtime smoke passed.
- `npm test` -> 13 files / 114 tests passed.
- `npm run build` -> TypeScript build and Vite production bundle passed.
- `npm run test:e2e` -> 5 passed / 1 skipped. The unpacked extension runtime smoke passed on desktop Chromium; mobile extension runtime smoke remains skipped by the existing project guard.
- `git diff --check` -> passed with no output.
- `bash /Users/bytedance/.agents/skills/check/scripts/run-tests.sh` -> 13 files / 114 tests passed.
- Subagent spec/status review found no blocking issues.
- Subagent runtime review found the extracted missing-target fixture had narrowed from generic `/missing-target`; fixed by restoring generic matching and adding fixture coverage for a future Pages missing-target path.
- `npm test -- tests/cloudflareDashboardFixture.test.ts` -> 1 file / 5 tests passed after review fix.
- `npm run test:e2e -- tests/e2e/extension-runtime.spec.ts --project=chromium` -> extension build passed and desktop unpacked extension runtime smoke passed after review fix.

## Post-Rebase Evidence

- Rebasing onto `origin/main@983329d` produced documentation index conflicts with the merged route-state guard slice. The conflict resolution keeps both route-state guard and runtime fixture boundary entries in the design index, product-spec index, and execution status ledger.
- `npm test -- tests/cloudflareDashboardFixture.test.ts` -> 1 file / 5 tests passed after rebase.
- `npm run build:extension && npm run test:e2e -- tests/e2e/extension-runtime.spec.ts --project=chromium` -> extension build passed and desktop unpacked extension runtime smoke passed after rebase.
- `npm test` -> 13 files / 123 tests passed after rebase.
- `npm run build` -> TypeScript build and Vite production bundle passed after rebase.
- `npm run test:e2e` -> 5 passed / 1 skipped after rebase. The unpacked extension runtime smoke passed on desktop Chromium; mobile extension runtime smoke remains skipped by the existing project guard.
- `git diff --check HEAD~1..HEAD` -> passed with no output after rebase.
- `bash /Users/bytedance/.agents/skills/check/scripts/run-tests.sh` -> 13 files / 123 tests passed after rebase.

## Known Caveats

- This branch is now rebased onto the merged route-state guard baseline. It remains independent from branch freshness and provider timeout until those branches merge.
