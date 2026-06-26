# Extension Reducer Intent Bridge

## Summary

Michi's injected extension shell already has local intent entry and service-kind choice. The React workbench now owns those same session transitions through `guideSessionReducer`. This slice bridges the injected shell's start and service-kind actions through the shared reducer while keeping the visible shell behavior unchanged.

## Goals

- Use `guideSessionReducer` for injected-shell intent start.
- Use `guideSessionReducer` for injected-shell backend/API and static-site choices.
- Preserve the existing rail, panel copy, guide step rendering, target highlights, page checks, confirmation, completion, and recovery behavior.
- Keep `workersGuideFlow` as the shell's current owner for page anchoring, local step navigation, critical confirmation, and completion gating.
- Add tests that prove the shell's start/service-kind choices match reducer output.

## Non-goals

- No React extension panel.
- No full extension-shell state migration.
- No manifest, permission, storage, network, backend, database, or Cloudflare automation changes.
- No visible UI redesign.
- No change to the local React workbench behavior.

## UX Behavior

The user should see no visual change. Opening `Guide`, clicking `Start guide`, choosing `Backend logic or API`, or choosing `Static website` should show the same panel states and copy as before.

## Domain Behavior

The injected shell keeps a compact shell state for rendering, but start/service-kind actions are calculated by a shared reducer session and then projected into shell state. The projection is intentionally narrow:

- `start` sets shell phase to reducer phase `clarify` and preserves the entered intent.
- `backend-api` sets shell phase to `guide` with step index `0`.
- `static-site` sets shell phase to `static-complete` and clears the active step index.

## Acceptance Criteria

- Shared reducer helper drives injected-shell start and service-kind transitions.
- Existing injected-shell behavior remains unchanged.
- Static-site route still renders Cloudflare Pages capability copy.
- Backend/API route still renders Workers step 1.
- Existing extension shell tests and browser smoke still pass.

## Test Requirements

- `npm test -- tests/extensionGuideSessionBridge.test.ts tests/injectedShell.test.ts`
- `npm test`
- `npm run build`
- `npm run test:e2e`
- `git diff --check`
- `bash /Users/bytedance/.agents/skills/check/scripts/run-tests.sh`
