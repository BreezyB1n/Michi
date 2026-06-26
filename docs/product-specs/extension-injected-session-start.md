# Extension Injected Session Start

## Summary

Michi's injected extension shell should be able to start a local guide session from user intent. The current shell can check the page, display guide semantics, and browse the Workers guide path. This milestone adds the first session-owned flow inside the extension surface: intent entry, guide start, and backend/API clarification.

## Goals

- Show a sample intent in the injected panel before a guide session starts.
- Let the user edit the intent locally inside the injected shell.
- Let the user start the guide and see the backend/API versus static-site clarification.
- Let the user choose backend/API and land on the first Workers guide step.
- Preserve page check, guide navigation, target highlight, recovery guidance, and `Escape` collapse behavior.

## Non-goals

- No full React content-script runtime.
- No critical action confirmation inside the extension shell yet.
- No completion or DNS follow-up flow inside the extension shell yet.
- No persisted session across page reloads.
- No automatic Cloudflare navigation, clicking, deployment, DNS mutation, or account writes.
- No new extension permissions or storage APIs.

## UX Behavior

When the user opens `Guide` before any page check, the panel shows the sample intent and a `Start guide` button.

After `Start guide`, Michi asks the same path-changing clarification used in the local web app:

- `Backend logic or API`
- `Static website`

Choosing `Backend logic or API` starts the Workers guide at `Step 1 / 5` with `Find the Workers entry`. Choosing `Static website` is acknowledged as Pages-adjacent and remains out of the runnable extension happy path for this milestone.

`Check page` remains available and can still sync the displayed guide step to the current Cloudflare route.

## Acceptance Criteria

- The injected shell can start from the sample intent.
- The injected shell asks the backend/API versus static-site clarification.
- Choosing backend/API displays `Cloudflare Workers`, `Step 1 / 5`, and `Find the Workers entry`.
- The rail still contains only `Guide` and `Check page`.
- Page checking still displays route, target, evidence, and highlight.
- Unit and Playwright coverage verify the injected session start path.

## Test Requirements

- `npm test`
- `npm run build`
- `npm run test:e2e`
