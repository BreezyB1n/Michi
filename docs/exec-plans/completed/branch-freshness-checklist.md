# Branch Freshness Checklist Execution Plan

## Goal

Add a local branch freshness checklist that prevents Michi frontend slices from being marked PR-ready when the branch is stale, already merged/superseded, or accidentally running on `main`.

## Scope

- Product spec: `docs/product-specs/branch-freshness-checklist.md`
- Decision record: `docs/design-docs/branch-freshness-checklist-decision.md`
- CLI/evaluator: `scripts/check-branch-freshness.mjs`
- Tests: `tests/branchFreshness.test.mjs`
- Workflow entry: `package.json`
- Status update: `docs/exec-plans/status.md`

## Non-goals

- No GitHub API or `gh` dependency.
- No automatic branch mutation, rebase, merge, PR close, or PR creation.
- No change to browser UI, extension runtime, manifest, permissions, or Cloudflare guide behavior.

## Tasks

- [x] Create feature branch from `origin/main`.
- [x] Add product spec, decision record, and active execution plan.
- [x] Add RED tests for ahead, behind, superseded, main, dirty warning, and strict-clean states.
- [x] Implement the local evaluator and CLI.
- [x] Add `npm run check:branch`.
- [x] Run focused tests and the local branch check.
- [x] Run full verification and `check`.
- [x] Move this plan to `completed/` with evidence.

## Evidence Ledger

- `npm test -- tests/branchFreshness.test.mjs` -> RED failed first because `scripts/check-branch-freshness.mjs` did not exist.
- `npm test -- tests/branchFreshness.test.mjs` -> 1 file / 7 tests passed after implementation.
- Subagent docs review found the merge gate should use `--strict-clean` and the next-direction copy was stale; both were fixed.
- Subagent script review found `ahead=0, behind>0` superseded branches were misclassified as stale; fixed with a RED regression test.
- `npm test -- tests/branchFreshness.test.mjs` -> 1 file / 9 tests passed after superseded-branch and CLI exit-code coverage.
- `npm test` -> 13 files / 118 tests passed.
- `npm run build` -> TypeScript build and Vite production bundle passed.
- `npm run test:e2e` -> 5 passed / 1 skipped. The unpacked extension runtime smoke passed on desktop Chromium; mobile extension smoke remains skipped by the existing project guard.
- `git diff --check` -> passed with no output.
- `bash /Users/bytedance/.agents/skills/check/scripts/run-tests.sh` -> 13 files / 118 tests passed.
- Post-commit `npm run check:branch -- --strict-clean` -> passed with branch ahead 1, behind 0, dirty files 0, status `ready`.
- Rebased onto `origin/main` after route-state guard merged, preserving both completed milestone rows and both spec/design index entries.
- Post-rebase `npm run check:branch -- --strict-clean` -> passed with branch ahead 1, behind 0, dirty files 0, status `ready`.
- Post-rebase `npm test` -> 13 files / 127 tests passed.
- Post-rebase `npm run build` -> TypeScript build and Vite production bundle passed.
- Post-rebase `npm run test:e2e` -> 5 passed / 1 skipped. The unpacked extension runtime smoke passed on desktop Chromium.
- Post-rebase `git diff --check HEAD~1..HEAD` -> passed with no output.
- Post-rebase `bash /Users/bytedance/.agents/skills/check/scripts/run-tests.sh` -> 13 files / 127 tests passed.
- Refresh replacement branch `codex/michi-branch-freshness-check-refresh` was created from `origin/main@983329d` to replace stale PR #18 without changing the branch-freshness content.
- Refresh branch `npm run check:branch -- --strict-clean` -> passed with branch ahead 1, behind 0, dirty files 0, status `ready`.
- Refresh branch `npm test -- tests/branchFreshness.test.mjs` -> 1 file / 9 tests passed.
- Refresh branch `npm test` -> 13 files / 127 tests passed.
- Refresh branch `npm run build` -> TypeScript build and Vite production bundle passed.
- Refresh branch `npm run test:e2e` -> 5 passed / 1 skipped. The unpacked extension runtime smoke passed on desktop Chromium.
- Refresh branch `git diff --check HEAD~1..HEAD` -> passed with no output.
- Refresh branch `bash /Users/bytedance/.agents/skills/check/scripts/run-tests.sh` -> 13 files / 127 tests passed.
- Refresh branch GitHub compare `main...codex/michi-branch-freshness-check-refresh` -> ahead 1, behind 0, total commits 1.

## Known Caveats

- This slice is rebased onto the merged route-state guard baseline. It remains independent from the unmerged fixture-boundary and provider-timeout slices; any status-file conflict should preserve all completed milestone rows.
