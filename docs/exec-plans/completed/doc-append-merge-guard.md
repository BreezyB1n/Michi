# Doc Append Merge Guard Execution Plan

## Goal

Reduce merge friction for independent Michi frontend slices that append to shared docs indexes and execution status.

## Scope

- Product spec: `docs/product-specs/doc-append-merge-guard.md`
- Decision record: `docs/design-docs/doc-append-merge-guard-decision.md`
- Git attributes: `.gitattributes`
- Regression test: `tests/docAppendMergeGuard.test.mjs`
- Status/index updates:
  - `docs/design-docs/index.md`
  - `docs/product-specs/index.md`
  - `docs/exec-plans/status.md`

## Non-goals

- No browser UI, extension runtime, manifest, permissions, or Cloudflare guide behavior changes.
- No GitHub API or `gh` integration.
- No automatic branch mutation, PR creation, PR closure, merge, rebase, or force push.
- No broad Markdown merge strategy outside the known append-only docs ledgers.

## Tasks

- [x] Create feature branch from `origin/main`.
- [x] Add RED regression test that simulates parallel docs append conflicts.
- [x] Configure the guarded docs files to use Git union merge behavior.
- [x] Run the focused regression test.
- [x] Run the full frontend merge gate.
- [x] Complete independent review/check.
- [x] Move this plan to `completed/` with evidence.

## Evidence Ledger

- `npm test -- tests/docAppendMergeGuard.test.mjs` -> RED failed before `.gitattributes` because a temporary git merge of parallel docs additions returned status 1.
- `npm test -- tests/docAppendMergeGuard.test.mjs` -> 1 file / 1 test passed after `.gitattributes` configured union merge for guarded docs.
- `npm test` -> 13 files / 119 tests passed.
- `npm run build` -> TypeScript build and Vite production bundle passed.
- `npm run test:e2e` -> 5 passed / 1 skipped. The unpacked extension runtime smoke passed on desktop Chromium; mobile extension runtime smoke remains skipped by the existing project guard.
- `git diff --check` -> passed with no output.
- `bash /Users/bytedance/.agents/skills/check/scripts/run-tests.sh` -> 13 files / 119 tests passed.
- Manual check review -> scope on target; `.gitattributes` applies only to the three guarded docs files; other Markdown files remain `merge: unspecified`.
- Subagent review attempts were unavailable because both narrow review agents did not complete before timeout and were closed; no subagent finding was accepted as evidence.
- Queue simulation with `git merge-tree --write-tree` -> clean for `origin/main -> doc append merge guard -> fixture boundary -> provider timeout -> branch freshness refresh`.
- Queue simulation confirmed each queued branch was individually `0 behind / 1 ahead` against `origin/main` and merge-tree clean before the ordered sequence.
