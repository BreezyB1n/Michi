# Shared Guide Session Reducer

## Summary

Michi now has two guide-state surfaces: the React workbench uses exported functions from `GuideCore`, and the injected extension shell uses Workers-specific flow helpers. The next step is to introduce a pure shared guide-session reducer for the React workbench session state, while preserving the current browser UI behavior.

This reducer makes guide session transitions explicit and testable as actions: start, choose service kind, advance, confirm critical action, apply host page context, simulate blocking state, recover, and reset.

## Goals

- Add a pure domain reducer for `GuideSession` transitions.
- Keep the React workbench UI behavior unchanged.
- Keep exported `GuideCore` functions available as compatibility wrappers.
- Keep critical write actions behind explicit confirmation.
- Keep provider/page context unable to bypass critical confirmation.
- Keep page drift and extension runtime failures mapped to recovery.
- Keep Workers completion recommending DNS follow-up.

## Non-goals

- No React extension panel packaging.
- No injected shell UI rewrite.
- No live Cloudflare automation.
- No new manifest permissions, storage, network calls, backend API, database, or AgentScope runtime integration.
- No change to the visible workbench layout or extension rail.

## UX Behavior

The user should see no visual change. The local React workbench should still start from an intent, ask for service clarification, route backend/API to Workers, advance through the Workers guide, require critical-action confirmation, recover from page drift, and complete with a DNS follow-up when the Worker URL check passes.

## Domain Behavior

The reducer accepts a `GuideSession` and a typed action, then returns the next `GuideSession`. It must not mutate the input session. Existing functions such as `startSession`, `chooseServiceKind`, `advanceStep`, and `applyHostPageContext` remain public wrappers around the reducer.

Reducer actions:

- `start`
- `choose-service-kind`
- `advance`
- `confirm-critical-action`
- `apply-host-page-context`
- `simulate-blocking-state`
- `recover-from-blocking-state`
- `reset`

## Acceptance Criteria

- A shared reducer module owns `GuideSession` transition logic for the React workbench.
- Existing `GuideCore` public functions delegate to the reducer.
- Existing React workbench component and browser behavior remain unchanged.
- Unit tests prove reducer actions for start, choose backend/API, critical confirmation, provider context, recovery, completion, and reset.
- Existing `GuideCore`, component, extension shell, and browser smoke tests still pass.

## Test Requirements

- `npm test -- tests/guideSessionReducer.test.ts tests/guideCore.test.ts`
- `npm test`
- `npm run build`
- `npm run test:e2e`
- `git diff --check`
- `bash /Users/bytedance/.agents/skills/check/scripts/run-tests.sh`
