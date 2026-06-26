# Extension Injected Guide Navigation

## Summary

Michi's injected extension shell should let users browse the Cloudflare Workers guide path inside the page-attached panel. The previous slice added guide semantics for the currently checked route. This slice adds local `Previous` and `Next step` controls so users can inspect adjacent guide steps without mutating the Cloudflare page.

## Goals

- Show guide progress as `Step N / 5` when a guide step is active.
- Let users move to the previous guide step inside the injected shell.
- Let users move to the next guide step inside the injected shell.
- Preserve route, location, target, evidence, highlight, recovery, and `Escape` collapse behavior.
- Keep navigation local to Michi's injected shell.

## Non-goals

- No automatic Cloudflare navigation.
- No automatic clicking, form filling, deployment, DNS mutation, or account writes.
- No persisted guide session across reloads.
- No full React content-script runtime.
- No new extension permissions or storage APIs.

## UX Behavior

After `Check page`, Michi maps the detected route to the matching Workers guide step and shows `Step N / 5`.

`Previous` displays the previous guide step when one exists. `Next step` displays the next guide step when one exists. Disabled controls remain visible at the first and final steps to keep the control layout stable.

The page context details still reflect the last checked page. This is intentional: guide navigation previews the path, while `Check page` refreshes the host-page anchor.

## Acceptance Criteria

- The injected panel shows guide progress for mapped Workers guide steps.
- `Next step` updates the panel from `Create a Worker` to `Review the starter response` without re-checking the page.
- `Previous` returns to the prior step.
- The rail still contains only `Guide` and `Check page`.
- The navigation controls do not trigger host-page writes or new extension permissions.
- Unit and Playwright coverage verify guide step navigation in the injected shell.

## Test Requirements

- `npm test`
- `npm run build`
- `npm run test:e2e`
