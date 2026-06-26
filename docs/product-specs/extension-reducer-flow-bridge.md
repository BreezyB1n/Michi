# Extension Reducer Flow Bridge

## Summary

Michi's injected extension shell should continue moving guide step actions toward the shared `guideSessionReducer`. The previous slice bridged intent start and service-kind choice. This slice bridges the local Workers flow actions that do not require new page-reading behavior: previous step, next step, critical-action confirmation, and final completion.

## Goals

- Use `guideSessionReducer` to calculate injected-shell previous-step projection.
- Use `guideSessionReducer` to calculate injected-shell next-step projection, including critical-action confirmation entry.
- Use `guideSessionReducer` to calculate injected-shell critical-action confirmation projection.
- Use `guideSessionReducer` to calculate final guide completion projection after existing Worker URL evidence gating passes.
- Preserve visible extension shell behavior, target highlights, page checks, unsupported recovery, scroll/resize refresh, and Cloudflare-only runtime boundaries.

## Non-goals

- No React extension panel.
- No full `GuideSession` store inside the injected shell.
- No manifest, permission, storage, network, backend, database, or Cloudflare automation changes.
- No new page context provider behavior.
- No visual redesign.

## UX Behavior

The user should see the same guide panel behavior as before:

- `Previous` moves back one Workers step and never goes below step 1.
- `Next step` enters explicit confirmation on critical write-action steps.
- `Confirm action` advances to the next guide step.
- `Complete guide` still requires Worker URL evidence before showing DNS follow-up.
- Page check and target highlight behavior remain unchanged.

## Domain Behavior

The injected shell keeps compact render state. The bridge reconstructs a deterministic Workers guide session from the shell state, runs one reducer action, then projects the result back into shell state. The shell still uses `workersGuideFlow` for host-page anchoring and completion evidence checks because those decisions currently depend on live page context.

## Acceptance Criteria

- Bridge helper exposes reducer-backed previous, next, confirm, and complete projections.
- Reducer-backed `Next step` enters confirmation before critical write actions.
- Reducer-backed confirmation advances from critical step 2 to step 3.
- Reducer-backed completion reaches `complete` only after existing shell evidence gating passes.
- Existing injected-shell user flows remain unchanged.
- Existing extension E2E smoke still passes.

## Test Requirements

- `npm test -- tests/extensionGuideSessionBridge.test.ts tests/injectedShell.test.ts tests/workersGuideFlow.test.ts`
- `npm test`
- `npm run build`
- `npm run test:e2e`
- `git diff --check`
- `bash /Users/bytedance/.agents/skills/check/scripts/run-tests.sh`
