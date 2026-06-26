# Extension Injected Guide Navigation Decision

## Decision

Add local guide-step navigation state to the vanilla injected shell instead of introducing a full React content-script runtime in this slice.

## Context

The injected shell can read page context, display the matched guide step, highlight page targets, explain recovery, and collapse with `Escape`. It still lacks a way for users to browse the Workers guide path inside the page-attached surface.

## Rationale

- Local step navigation is the smallest user-visible progression from static guide semantics to an interactive guide surface.
- The shell can reuse `workersGuideSteps` without adding new permissions, storage, or Cloudflare automation.
- Keeping page context refresh behind `Check page` avoids pretending that preview navigation has changed the host page.
- A full React extension shell should be reserved for a later milestone when Michi needs persistent session state, intent entry, clarification, and confirmation inside the extension.

## Consequences

- The injected shell will keep a small `activeStepIndex` field in memory.
- `Check page` sets the active step to the route-matched guide step.
- `Previous` and `Next step` update the displayed guide step only.
- The page context section continues to show the last checked route and target.

## Rollback

Remove the navigation controls and `activeStepIndex` state from `src/extension/injectedShell.ts`. Guide semantics, recovery guidance, target highlight, and page checking remain intact.
