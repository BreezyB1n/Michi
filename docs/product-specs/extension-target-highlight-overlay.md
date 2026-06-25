# Michi Extension Target Highlight Overlay Product Spec

## Summary

Michi's fifth milestone makes page anchoring visible by drawing a lightweight highlight around the current guide target after the user runs `Check page` in the injected extension shell.

The previous milestone proved that Michi can appear on a Cloudflare page and render page context. This milestone makes the page context actionable for the user by connecting the reported target to a visible overlay on the host page.

## Approved Design Summary

### Building

Build a read-only target highlight overlay inside the injected shell's Shadow DOM. When `Check page` returns a `HostPageContext` with a target bounding box, Michi renders a fixed-position outline around the preferred target for the detected route.

### Not Building

- No automatic clicking.
- No form filling.
- No deploy or DNS mutation.
- No persistent overlay storage.
- No MutationObserver tracking.
- No screenshot or pixel capture.

### Approach

Use the `PageTarget.boundingBox` already produced by the content-script page reader. The injected shell chooses the route-preferred target, renders the panel text, and renders one fixed highlight rectangle when the target has a bounding box. If no bounding box exists, the panel still shows the target text and omits the overlay.

### Key Decisions

- Keep highlight rendering in Shadow DOM so styles stay isolated.
- Use fixed viewport coordinates because `getBoundingClientRect()` already returns viewport-relative geometry.
- Render only one preferred target to avoid clutter.
- Keep refresh manual through `Check page`.

### Unknowns

- No blocking unknowns for this milestone.
- Deferred technical question: whether future highlights need live repositioning during scroll. Owner: future page-anchoring polish spec after static highlighting is proven.

## Functional Requirements

- `Check page` renders one highlight when the preferred target has a bounding box.
- The highlight is positioned from `PageTarget.boundingBox`.
- The highlight includes an accessible label naming the target.
- The panel continues to show route, location, target, and evidence.
- If no bounding box is available, no highlight is rendered and the panel remains usable.
- `Min` removes the panel and highlight.

## Non-Functional Requirements

- No timers.
- No DOM mutation outside the Michi injected root.
- No remote data transfer.
- No host-page style leakage.
- Overlay must not consume clicks intended for the host page.

## Acceptance Criteria

- Unit tests cover highlight style generation.
- Unit tests cover no-highlight behavior when no bounding box exists.
- Browser runtime smoke confirms the highlight appears on the Cloudflare fixture after `Check page`.
- Existing injected shell tests still pass.
- Existing app and extension runtime tests still pass.

## Test Requirements

- `npm test`
- `npm run build`
- `npm run test:e2e`

## Rollback

Rollback removes highlight rendering from `injectedShell.ts`. The page reader, context provider, injected panel, and service worker remain intact.
