# Extension Provider Timeout Execution Plan

## Goal

Prevent Michi's extension page context provider from hanging indefinitely when extension messaging never calls back.

## Scope

- Product spec: `docs/product-specs/extension-provider-timeout.md`
- Decision record: `docs/design-docs/extension-provider-timeout-decision.md`
- Provider: `src/domain/extensionPageContextProvider.ts`
- Tests: `tests/extensionPageContextProvider.test.ts`

## Non-goals

- No manifest, permission, content script, service worker, message-contract, guide reducer, or visible layout changes.
- No retries, polling, long-lived connections, real Cloudflare account access, or browser store packaging.

## Tasks

- [x] Create feature branch from `origin/main`.
- [x] Add product spec, decision record, and active execution plan.
- [x] Add RED tests for timeout and late-callback behavior.
- [x] Implement provider timeout configuration and single-resolution guard.
- [x] Run focused provider tests.
- [x] Run full verification and `check`.
- [x] Complete subagent review and address findings.
- [x] Move this plan to `completed/` with evidence.

## Evidence Ledger

- `npm test -- tests/extensionPageContextProvider.test.ts` -> RED failed first: stalled runtime test timed out and late callback returned successful context.
- `npm test -- tests/extensionPageContextProvider.test.ts` -> 1 file / 5 tests passed after timeout implementation.
- `npm run build` initially failed because the new test used `afterEach` without importing it from Vitest; fixed with an explicit import.
- `npm run build` -> TypeScript build and Vite production bundle passed after the import fix.
- `npm test` -> 12 files / 111 tests passed.
- `npm run test:e2e` -> 5 passed / 1 skipped. The unpacked extension runtime smoke passed on desktop Chromium; mobile extension runtime smoke remains skipped by the existing project guard.
- `git diff --check` -> passed with no output.
- `bash /Users/bytedance/.agents/skills/check/scripts/run-tests.sh` -> 12 files / 111 tests passed.
- Subagent provider/runtime review found no blocking issues.
- Subagent docs review found acceptance evidence did not cover missing runtime, explicit runtime error response, or invalid response; fixed by adding provider tests.
- `npm test -- tests/extensionPageContextProvider.test.ts` -> 1 file / 8 tests passed after acceptance coverage fix.
- Rebased onto `origin/main` after route-state guard merged, preserving both completed milestone rows and both spec/design index entries.
- Post-rebase `npm test` -> 12 files / 123 tests passed.
- Post-rebase `npm run build` -> TypeScript build and Vite production bundle passed.
- Post-rebase `npm run test:e2e` -> 5 passed / 1 skipped. The unpacked extension runtime smoke passed on desktop Chromium.
- Post-rebase `git diff --check HEAD~1..HEAD` -> passed with no output.
- Post-rebase `bash /Users/bytedance/.agents/skills/check/scripts/run-tests.sh` -> first run hit Vitest worker startup timeouts after e2e; rerunning the same command passed with 12 files / 123 tests.

## Known Caveats

- Runtime code and provider tests are independent from the unmerged route-state guard, branch freshness, and fixture boundary branches. Documentation index/status files overlap with those branches and may need straightforward merge reconciliation if another branch lands first.
