# Extension Reducer Page Check Bridge

## Summary

Michi's injected extension shell should route page-check state transitions through the shared `guideSessionReducer`. Previous slices moved intent, service-kind choice, local step navigation, confirmation, and completion projection into the reducer bridge. This slice applies the same direction to `Check page`, including page drift recovery and recovery-to-guide return.

## Goals

- Use `guideSessionReducer` to project checked page context into the injected shell state.
- Preserve `workersGuideFlow` as the owner of route-to-step anchoring and Worker URL completion evidence checks.
- Enter recovery when checked page context is unsupported or missing the expected target.
- Return from recovery to guide when a subsequent page check finds the expected target again.
- Preserve visible shell behavior, target highlights, unsupported guidance, critical confirmation, and completion follow-up.

## Non-goals

- No full `GuideSession` store inside the injected shell.
- No React extension panel.
- No manifest, permission, storage, network, backend, database, or Cloudflare automation changes.
- No visual redesign.
- No real Cloudflare account automation.

## UX Behavior

The user should see the same `Check page` affordance and panel layout:

- Checking a supported Cloudflare route shows the matching guide step.
- Checking a page missing the expected target shows recovery guidance.
- Checking again after the target is visible returns to the guide step.
- Checking an unsupported Cloudflare area does not show stale confirmation or completion copy.
- Existing target highlight and evidence copy remain driven by the current page context.

## Domain Behavior

The bridge reconstructs a deterministic Workers guide session from the compact shell state, uses `workersGuideFlow` only to anchor a detected route to a Workers step index, applies `guideSessionReducer({ type: "apply-host-page-context" })`, then projects the reducer phase and active step back into shell state.

## Acceptance Criteria

- Bridge helper exposes reducer-backed page-check projection.
- Supported route checks project to `guide` with the anchored active step.
- Missing expected target projects to `recovery`.
- Recovered target projects from `recovery` back to `guide`.
- Unsupported contexts project to recovery without rendering stale step state.
- Existing extension shell tests and browser smoke still pass.

## Test Requirements

- `npm test -- tests/extensionGuideSessionBridge.test.ts tests/injectedShell.test.ts tests/workersGuideFlow.test.ts tests/guideSessionReducer.test.ts`
- `npm test`
- `npm run build`
- `npm run test:e2e`
- `git diff --check`
- `bash /Users/bytedance/.agents/skills/check/scripts/run-tests.sh`
