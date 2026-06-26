# Extension Highlight Reposition

## Summary

Michi's injected extension shell already renders a read-only highlight around the current guide target after `Check page`. That highlight should remain visually attached to the target when the user scrolls or resizes the host page.

## Goals

- Recompute the current checked page context after scroll and resize events.
- Keep the highlight rectangle aligned with the preferred target's latest viewport bounding box.
- Preserve the current guide phase, active step, route, recovery state, and panel open/collapsed state.
- Keep refresh event-driven and local to the injected shell.

## Non-goals

- No timers, polling, or `MutationObserver`.
- No automatic navigation, clicking, form filling, deploy, DNS, or other Cloudflare mutation.
- No new extension permissions, storage, host permissions, or network calls.
- No persisted highlight state across page reloads.
- No attempt to support non-Cloudflare origins.

## UX Behavior

After the user clicks `Check page`, Michi stores the latest `HostPageContext` and renders a target highlight when the preferred target has a bounding box. If the user scrolls or resizes the page, Michi refreshes that checked context and redraws the highlight at the target's current viewport position.

If the panel is collapsed, the stored context is still refreshed so reopening the panel shows the same route and target with the updated highlight. If no check has run yet, scroll and resize do nothing.

## Acceptance Criteria

- Scroll after `Check page` updates the highlight coordinates from the latest target bounding box.
- Resize after `Check page` updates the highlight coordinates.
- Scroll or resize before any page check does not open the panel or create a highlight.
- Refreshing the highlight does not reset the active guide step, critical confirmation state, completion state, or recovery copy.
- The extension still has no extra permissions, storage, network calls, timers, polling, or automatic Cloudflare actions.
- Unit and Playwright coverage verify the event-driven highlight refresh path.

## Test Requirements

- `npm test -- tests/injectedShell.test.ts`
- `npm run build:extension && npx playwright test tests/e2e/extension-runtime.spec.ts --project=chromium`
- `npm test`
- `npm run build`
- `npm run test:e2e`
- `git diff --check`
