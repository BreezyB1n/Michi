# Extension Highlight Reposition Decision

## Decision

Refresh the injected shell's checked `HostPageContext` on host-page scroll and resize only after the user has manually run `Check page`.

## Context

The target highlight uses fixed viewport coordinates derived from `getBoundingClientRect()`. Those coordinates become stale after scrolling or resizing because the Shadow DOM overlay is rendered once with the old bounding box.

## Rationale

- Event-driven refresh keeps the highlight aligned without background polling.
- Reusing `readCloudflarePageContext()` keeps route and target detection centralized.
- Keeping refresh gated behind a prior manual page check preserves the current product rule: Michi reads page state only when the user has started page anchoring.
- The shell state should keep its guide phase and active step so visual refresh does not become hidden guide navigation.

## Consequences

- The injected shell adds scroll and resize listeners while mounted.
- The listeners only re-render when a checked context already exists.
- If Cloudflare changes DOM structure during scroll or resize, the panel may update into existing recovery guidance rather than drawing a stale highlight.

## Rollback

Remove the scroll and resize listeners and the context-refresh helper from `src/extension/injectedShell.ts`. Existing manual `Check page` highlighting remains intact.
