# Doc Append Merge Guard

## Summary

Michi keeps product specs, design decisions, and execution status in append-only Markdown indexes. Parallel frontend slices often add one line to the same index or status table, which makes otherwise independent PRs conflict during merge. Add a Git merge guard so these append-only files preserve both sides of parallel additions.

## Goals

- Let independent PRs append milestone/spec/decision rows to the shared docs indexes without manual conflict resolution.
- Keep the guard local to known append-only docs files.
- Preserve both sides of concurrent additions when merging branches in either order.
- Add automated coverage that proves the configured merge behavior with a real temporary git repository.

## Non-goals

- No automatic PR creation, closing, rebasing, or merging.
- No GitHub API, token, or CI integration.
- No change to Michi browser UI, extension runtime, Cloudflare guide behavior, manifest, or permissions.
- No broad merge strategy for arbitrary Markdown files.

## Acceptance Criteria

- `.gitattributes` configures the append-only docs index/status files to use Git's union merge behavior.
- A regression test creates two temporary branches that append different milestone lines to the guarded files and verifies that merging keeps both additions without conflict.
- The existing frontend verification baseline remains green.
- The execution status recommends keeping these files append-only; non-append edits still require normal review.

## Test Requirements

- Focused test:
  - `npm test -- tests/docAppendMergeGuard.test.mjs`
- Merge gate:
  - `npm test`
  - `npm run build`
  - `npm run test:e2e`
  - `git diff --check`
  - `bash /Users/bytedance/.agents/skills/check/scripts/run-tests.sh`
