# Extension Injected Session Start Decision

## Decision

Add a small local session-start state machine to the vanilla injected shell, reusing the existing guide copy and capability fixtures.

## Context

The injected shell can currently display page context and guide-step previews. It cannot yet start from user intent inside the extension surface. The local React app already demonstrates the full MVP flow, but the extension shell needs its own first-session interaction to become a useful browser-side guide surface.

## Rationale

- Intent entry and clarification are the smallest meaningful step from guide preview toward a usable extension guide session.
- Keeping the state local avoids storage, account writes, and cross-tab synchronization.
- Reusing existing guide copy keeps the extension shell aligned with the local web app.
- A full React content-script runtime should be evaluated after this slice proves session start inside the host page.

## Consequences

- `src/extension/injectedShell.ts` will hold local `intent` and session phase fields.
- `Start guide` changes only Michi's injected panel state.
- Backend/API selection starts the Workers guide at step 1.
- Page checks can still override the active preview step based on the detected Cloudflare route.

## Rollback

Remove the local intent and clarification rendering from `src/extension/injectedShell.ts`. Page check, guide semantics, guide navigation, target highlight, and recovery guidance remain intact.
