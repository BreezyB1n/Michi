# Branch Freshness Checklist

## Summary

Michi development should have a lightweight local checklist that catches stale or already-superseded branches before a pull request is treated as ready. The check exists to prevent the current workflow problem where old PRs remain open even after their commits are already included in `main`, or a branch is reviewed while it is behind the latest base.

## Goals

- Show whether the current branch is ahead, behind, or identical to `origin/main`.
- Warn when a branch has no unique commits because it has likely already been merged or superseded.
- Fail when the developer is accidentally working on `main`.
- Keep dirty working tree state visible without blocking normal in-progress development by default.
- Provide a strict mode for pre-PR use that fails on uncommitted changes.
- Fit the existing local verification flow without adding GitHub API credentials, new services, or CI provider dependencies.

## Non-goals

- No GitHub API integration.
- No automatic PR closing, PR creation, merging, rebasing, or force pushing.
- No branch protection or CI replacement.
- No dependency on `gh`, GitHub tokens, GitHub API calls, or new service credentials.
- The default `origin/main` base may run a normal `git fetch origin`, so it can require the developer's existing git remote access.
- No change to the Michi browser app, extension runtime, manifest, permissions, or guide behavior.

## User Workflow

Before opening or updating a PR, run:

```bash
npm run check:branch
```

For a final pre-PR gate, run:

```bash
npm run check:branch -- --strict-clean
```

The command should print a concise report:

- current branch
- base branch
- commits behind base
- commits ahead of base
- worktree cleanliness
- recommended action
- fetch/auth failures from the configured git remote when the base cannot be refreshed

## Acceptance Criteria

- A clean feature branch that is ahead of `origin/main` and not behind passes.
- A feature branch that is behind `origin/main` fails and tells the developer to sync with main.
- A branch with zero unique commits fails and tells the developer it is likely already merged or superseded.
- Running on `main` fails.
- Dirty worktree state is a warning by default.
- Dirty worktree state fails with `--strict-clean`.
- The package script exposes the command as `npm run check:branch`.
- The execution status document includes the check in the recommended merge gate.

## Test Requirements

- Unit tests cover the branch evaluation rules without touching the real repository.
- A local smoke run of `npm run check:branch` validates the CLI path against the current checkout.
- The full frontend merge gate still passes:
  - `npm test`
  - `npm run build`
  - `npm run test:e2e`
  - `git diff --check`
  - `bash /Users/bytedance/.agents/skills/check/scripts/run-tests.sh`
