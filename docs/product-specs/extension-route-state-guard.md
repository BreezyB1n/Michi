# Extension Route State Guard

## Summary

Michi should preserve the user's selected guide path when the injected extension shell checks a Cloudflare page from the other path. If a user has chosen the Workers path and checks a Pages route, or has chosen the Pages path and checks a Workers route, Michi should enter recovery instead of silently changing `serviceKind` and re-anchoring to the other guide.

## Goals

- Preserve `serviceKind` once the user has chosen `Backend logic or API` or `Static website`.
- Allow route-based service inference only before a guide path exists.
- Detect cross-path page checks between Workers and Pages while a guide is active.
- Explain the route mismatch in recovery copy without losing the selected path or active step.
- Keep existing same-path page checks, unsupported-page recovery, critical confirmation safety, Reset, and completion behavior unchanged.

## Non-goals

- No new Cloudflare capability path.
- No real Cloudflare account automation, account writes, network writes, storage, backend, database, or manifest permission changes.
- No React rewrite of the injected shell.
- No persistent browser storage for route history.
- No change to no-session direct anchoring from a supported Cloudflare page.

## UX Behavior

When no guide is active, pressing `Check page` may infer the path from the current Cloudflare route:

- Workers route -> Workers guide.
- Pages route -> Pages guide.

When a guide path is active, pressing `Check page` must keep that path fixed:

- Workers guide + Workers route -> anchor to matching Workers step.
- Pages guide + Pages route -> anchor to matching Pages step.
- Workers guide + Pages route -> recovery, with copy explaining that the current page belongs to Pages while the active guide is Workers.
- Pages guide + Workers route -> recovery, with copy explaining that the current page belongs to Workers while the active guide is Pages.

Recovery should tell the user to return to the selected path's expected Cloudflare page or reset and choose the other path.

## Domain Behavior

`ExtensionGuideSessionBridgeState.serviceKind` is the selected path authority once present. `serviceKindForRouteId(context.routeId)` is only allowed to infer a path when `state.serviceKind` is missing.

Cross-path checks should be represented as a blocking page context before applying the shared `guideSessionReducer`, so the reducer remains the owner of recovery projection.

## Acceptance Criteria

- Checking a Pages route during an active Workers guide preserves `serviceKind: "backend-api"` and enters `recovery`.
- Checking a Workers route during an active Pages guide preserves `serviceKind: "static-site"` and enters `recovery`.
- Recovery evidence includes both the selected path and the detected page path.
- Checking the correct path after route-mismatch recovery returns to `guide`.
- No active guide still supports route inference from Workers and Pages routes.
- Critical confirmation still cannot be bypassed by checking a route from either path.
- Injected shell renders route-mismatch recovery copy without stale completion or wrong-path step copy.
- Existing Workers and Pages happy paths still pass.

## Test Requirements

- `npm test -- tests/extensionGuideSessionBridge.test.ts tests/injectedShell.test.ts tests/workersGuideFlow.test.ts`
- `npm test`
- `npm run build`
- `npm run test:e2e`
- `git diff --check`
- `bash /Users/bytedance/.agents/skills/check/scripts/run-tests.sh`
