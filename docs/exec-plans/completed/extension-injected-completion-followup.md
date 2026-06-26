# Extension Injected Completion Follow-up Execution Plan

## Goal

Add local completion and DNS follow-up to Michi's injected extension shell so the Workers guide can finish after the page reader detects Worker URL evidence.

## Scope

- Product spec: `docs/product-specs/extension-injected-completion-followup.md`
- Decision record: `docs/design-docs/extension-injected-completion-followup-decision.md`
- Injected shell UI/state: `src/extension/injectedShell.ts`
- Tests: `tests/injectedShell.test.ts`, `tests/e2e/extension-runtime.spec.ts`
- Evidence ledger: this file

## Non-goals

- No host-page mutation beyond Michi's existing Shadow DOM root.
- No real Cloudflare writes, DNS writes, deployment, or automatic navigation.
- No production Chrome Web Store packaging.
- No new permissions or browser storage.
- No React content-script migration.

## Tasks

- [x] Create stacked feature branch.
- [x] Add repo-local spec, execution plan, and decision record.
- [x] Add failing tests for injected completion and DNS follow-up.
- [x] Implement local completion phase in the injected shell.
- [x] Run unit, build, e2e, diff, `/check`, and subagent review.
- [x] Record verification evidence.

## Evidence Ledger

| Check | Result | Evidence | Caveat |
| --- | --- | --- | --- |
| `npm test -- tests/injectedShell.test.ts` | Pass | RED first failed because `Complete guide` did not exist; after implementation and the local-navigation negative regression, 11 tests passed. | Focused injected-shell coverage only. |
| `npm test` | Pass | 7 test files passed, 39 tests passed. | Uses bundled local Node runtime path. |
| `npm run build` | Pass | `tsc -b && vite build` completed and emitted `dist/`. An intermediate TypeScript nullability failure in `isWorkerGuideComplete` was fixed with an explicit early return. | Uses bundled local Node runtime path. |
| `npm run test:e2e` | Pass | Extension build completed; Playwright reported 3 passed, 1 skipped. Chromium unpacked-extension smoke covered Worker URL completion and DNS follow-up. | Mobile extension-runtime smoke remains intentionally skipped by project config. |
| `git diff --check` | Pass | Exit 0 with no whitespace errors. | No output on success. |
| `/check` review | Pass | `bash /Users/bytedance/.agents/skills/check/scripts/run-tests.sh` passed with 7 test files and 39 tests. | Base review before subagent findings. |
| Product/runtime subagent review | Pass | Explorer subagent reported no P0/P1/P2 findings. It verified the evidence gate, local-navigation negative regression, preserved Guide/Check, Previous, critical confirmation, highlight, recovery, and Escape behavior. | Read-only review; no file edits. |
| Security/permission subagent review | Pass | Explorer subagent reported no P0/P1/P2 findings. It verified no manifest permission expansion, storage, scripting, network request, automatic Cloudflare action, deployment, or DNS write. | Read-only review; no file edits. |
