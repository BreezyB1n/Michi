# Michi Extension Injected Guide Shell Product Spec

## Summary

Michi's fourth milestone turns the extension runtime from an invisible page-context pipe into a visible page-attached shell on supported Cloudflare dashboard pages.

The shell is intentionally small: a collapsed rail, a guide panel toggle, and a manual page check that reads the current page through the same content-script page reader introduced in the browser runtime spike. This milestone proves that a user can see Michi on the host page and request current-page context without publishing to the Chrome Web Store or automating Cloudflare actions.

## Approved Design Summary

### Building

Build a minimal Shadow DOM injected shell from the content script. The shell mounts on `https://dash.cloudflare.com/*`, stays collapsed by default, opens a compact Michi panel, and lets the user run `Check page` to display route, target, and evidence from `HostPageContext`.

### Not Building

- No Chrome Web Store release.
- No full React app injection.
- No browser side panel.
- No automatic clicks, form fills, deploys, or DNS writes.
- No remote page text upload.
- No generic website support outside Cloudflare dashboard matches.

### Approach

Use a vanilla content-script shell with Shadow DOM scoped styles. The content script already has DOM access and the page reader already normalizes page state into `HostPageContext`, so the smallest useful next step is to mount an isolated UI next to the page instead of introducing a second React build target.

This plan assumes the shell is a proving surface, not the final Michi product UI. If the injected shell starts needing the full Guide Core workflow, the next milestone should package the React shell rather than expanding the vanilla shell.

### Key Decisions

- Mount in Shadow DOM to avoid leaking styles into Cloudflare or inheriting unstable dashboard CSS.
- Keep the rail collapsed by default so Michi does not occupy too much page space.
- Keep `Check page` manual because high-frequency DOM observation is outside this milestone.
- Display only route, primary target, and evidence because the shell is proving page anchoring, not replacing the main workbench.

### Unknowns

- No blocking unknowns for this milestone.
- Deferred product question: whether the injected shell should eventually reuse the full React Guide UI. Owner: next product spec after the vanilla shell proves the page-mounted surface.

## Functional Requirements

- Content script mounts exactly one Michi shell per page.
- The mounted shell uses Shadow DOM.
- The default state is a compact rail with `Guide` and `Check page` controls.
- `Guide` expands a compact panel without navigating or mutating the host page.
- `Check page` reads `HostPageContext` through the local Cloudflare page reader.
- The panel shows current route, location label, first target, and primary evidence.
- The shell has no `Image` or `Video` controls.
- The shell can be minimized back to rail.

## Non-Functional Requirements

- No remote code.
- No `eval`.
- No timers created from strings.
- No browser storage.
- No full DOM snapshot persistence.
- Styles must be scoped to the shell.
- The shell must not block normal host-page scrolling or navigation.

## Acceptance Criteria

- Loading the unpacked extension on a Cloudflare fixture page injects a visible Michi rail.
- Clicking `Guide` opens the injected panel.
- Clicking `Check page` displays a detected Cloudflare route and target.
- The existing service worker and page-context message smoke still passes.
- Local web demo remains mock-provider based by default.
- Existing app e2e flow remains unchanged.

## Test Requirements

### Unit Tests

- Injected shell mounts once and uses Shadow DOM.
- Rail exposes `Guide` and `Check page`.
- Panel opens and minimizes.
- `Check page` renders route, target, and evidence from a fixture page.
- Shell contains no `Image` or `Video` controls.

### Browser Runtime Checks

- Build the extension artifact.
- Launch Chromium with the unpacked extension.
- Route a Cloudflare fixture page.
- Confirm the injected rail is visible in the page.
- Open the panel, run `Check page`, and confirm route/target text is rendered.
- Keep the existing content-script message smoke.

### Existing Regression Tests

- `npm test`
- `npm run build`
- `npm run test:e2e`

## Rollback

Rollback is low cost because the shell is mounted by the content script. Remove the shell module and its content-script call; keep the page reader, service worker, provider adapter, mock provider, and main React app intact.
