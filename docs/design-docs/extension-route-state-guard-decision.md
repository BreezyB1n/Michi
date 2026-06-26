# Extension Route State Guard Decision

## Decision

Treat the selected `serviceKind` as sticky guide intent in the injected extension shell. Page checks can infer a service kind only before the user has selected a guide path. After selection, cross-path page checks become recovery states rather than automatic route switches.

## Context

Michi now supports both Workers and Pages guide paths. The page reader can detect both route families, and the bridge can reconstruct sessions from compact shell state. That makes route inference useful before a guide starts, but risky after intent is known: a page navigation could otherwise look like the user changed goals.

## Rationale

- The user's clarification is stronger evidence than the currently visible Cloudflare route.
- Silent path switching can bypass expected context, show wrong capability copy, or confuse recovery.
- Recovery is already the established pattern for page drift and unsupported states.
- Keeping route inference before path selection preserves the useful direct-anchor behavior for users who press `Check page` first.

## Consequences

- The bridge needs an explicit cross-path guard before anchoring a checked context.
- Recovery evidence must name the mismatch clearly enough for the injected shell and React state panels.
- Tests must cover both directions: Workers guide on Pages route and Pages guide on Workers route.
- No manifest, permission, storage, or Cloudflare write behavior changes.

## Rollback

Remove the cross-path guard and associated tests. The bridge would return to route-first anchoring behavior while existing same-path guide flows remain unchanged.
