# Branch Freshness Checklist Decision

## Decision

Add a local Node-based branch freshness check to Michi's development workflow. The check compares the current branch with `origin/main`, reports ahead/behind state, and fails only for states that make PR readiness misleading: working on `main`, being behind base, or having no unique branch commits.

## Context

Michi is being developed in small branches and PRs. Several old branches can remain visible as open PRs even after their commits are included through later merge commits. That makes GitHub's PR list look blocked or stale even when the actual work is already on `main`.

The repo currently has reliable local verification commands for tests, build, e2e, and whitespace. It does not have a lightweight command that distinguishes local green tests from branch freshness.

## Rationale

- The check is useful before PR creation and after review feedback because it catches a different class of readiness problem than tests.
- A local script works without `gh`, GitHub API quota, or GitHub tokens, which keeps it reliable in the current development environment.
- The script may still use ordinary `git fetch` for remote-tracking bases such as `origin/main`; that is an explicit tradeoff to avoid stale ahead/behind results.
- Treating dirty worktree state as a warning by default keeps the command usable during development.
- Strict clean mode gives a stronger final gate before a branch is announced as PR-ready.
- The command should report recommended action instead of mutating git state, because rebases, branch closure, and force pushes need explicit human intent.

## Consequences

- `package.json` gains a development workflow script.
- A small CLI/evaluator module and focused tests become part of the repo.
- Future execution plans should run this check before saying a branch is PR-ready.
- GitHub PR cleanup still remains manual when old PRs are already superseded.

## Rollback

Remove the package script, the branch freshness module, its tests, and the documentation references. Existing Michi app and extension runtime behavior would be unchanged.
