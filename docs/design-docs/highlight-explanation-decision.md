# Highlight Explanation Decision

## Decision

Michi will explain highlighted page targets with a small read-only callout attached to the target highlight.

## Context

The existing highlight outline proves where Michi is anchoring the guide, but it does not explain itself. The side panel already contains target and evidence rows, yet users often notice the in-page outline before reading the panel details.

## Rationale

- A callout makes the target anchor understandable at the point of attention.
- Keeping the callout read-only preserves the rule that Michi does not mutate the host surface.
- Reusing existing target labels avoids a second copy system and keeps provider-specific identifiers internal.
- Rendering in the injected shadow root keeps styles isolated and lets the callout disappear with the highlight.
- Clamping to the viewport gives mobile and narrow desktop layouts a stable no-overflow rule.

## Consequences

- The injected shell gets one more presentation helper for callout text and position.
- The React workbench mirrors the concept in the host preview for local review.
- Recovery, missing-target, route-mismatch, and minimized states must suppress the callout.

## Rollback

Remove the target callout presenter and rendering path. The existing highlight outline, side panel, page checks, recovery behavior, and tests can remain.
