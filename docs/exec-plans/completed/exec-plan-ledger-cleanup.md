# Execution Plan Ledger Cleanup

## Goal

Make Michi's execution-plan folders reflect actual frontend milestone state.

## Scope

- Move completed execution plans from `docs/exec-plans/active/` to `docs/exec-plans/completed/`.
- Add a milestone status overview under `docs/exec-plans/`.
- Update `docs/PLANS.md` to point to the status overview.
- Keep product specs and code behavior unchanged.

## Non-goals

- No React app, injected shell, extension runtime, manifest, permission, or test behavior changes.
- No product-spec deletion.
- No GitHub PR or issue edits.
- No release, merge, or Chrome Web Store action.

## Tasks

- [x] Create cleanup branch.
- [x] Add active execution plan for this cleanup slice.
- [x] Move completed plans into `completed/`.
- [x] Add milestone status overview.
- [x] Run diff/docs checks and record evidence.
- [x] Stage cleanup changes for commit and push.

## Evidence Ledger

| Check | Result | Evidence | Caveat |
| --- | --- | --- | --- |
| `git status --short --branch` | Pass | Branch `codex/michi-exec-plan-ledger-cleanup`; pending changes are docs/exec-plan moves and status docs only. | Recorded before final staging/commit. |
| `test -z "$(find docs/exec-plans/active -maxdepth 1 -type f -name '*.md' -print)"` | Pass | Output: `active-empty`. | Final state after moving this cleanup plan into `completed/`. |
| `test "$(find docs/exec-plans/completed -maxdepth 1 -type f -name '*.md' | wc -l | tr -d ' ')" -ge 13` | Pass | Output: `completed-count-ok`. | Final completed plan count includes this cleanup plan. |
| `git diff --check` | Pass | Exit 0, no output. |  |
| `/check` review | Pass | `run-tests.sh` executed `npm test`; 9 files, 56 tests passed. | Docs-only slice; no browser runtime changed. |
