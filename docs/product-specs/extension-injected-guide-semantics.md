# Extension Injected Guide Semantics

## Summary

Michi's injected extension shell should explain the guide step that corresponds to the page it just checked. The current shell proves that route, target, evidence, highlight, recovery, and keyboard collapse can work on a Cloudflare page. This milestone completes the visible guide semantics for the extension shell by showing capability, step title, action, purpose, and completion check inside the injected panel.

## Goals

- Render the Cloudflare Workers capability in the injected panel after `Check page`.
- Map the checked Cloudflare route to the matching Workers guide step.
- Show guide step title, action, step purpose, and completion check.
- Keep route, location, target, evidence, highlight, recovery guidance, and `Escape` collapse behavior unchanged.
- Keep the implementation deterministic and local.

## Non-goals

- No full React app injection.
- No persistent guide session inside the content script.
- No automatic clicking, form filling, deployment, DNS mutation, or account writes.
- No Chrome Web Store release.
- No new permissions, storage, background polling, or remote services.

## UX Behavior

Before a page check, the panel shows the existing empty check state.

After `Check page`, if the route maps to a Workers guide step, the panel shows:

- the selected capability: `Cloudflare Workers / Compute`
- the matched guide step title
- the action the user should take
- why the step matters
- the completion check Michi will use
- the existing route, location, target, and evidence details

If the route is unsupported or cannot be mapped to a guide step, the panel keeps the recovery or context-only behavior and does not invent a guide step.

## Acceptance Criteria

- The injected shell displays guide semantics for supported Cloudflare Workers route checks.
- The guide semantics reuse the existing Workers guide step copy from the site skill pack.
- The panel still has only `Guide` and `Check page` rail controls.
- Missing-target recovery remains visible when the expected target is absent.
- Target highlight behavior remains unchanged.
- Unit and Playwright coverage verify the guide semantics in the injected extension shell.

## Test Requirements

- `npm test`
- `npm run build`
- `npm run test:e2e`
