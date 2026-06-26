# Extension Injected Unsupported Hardening

## Summary

Michi's injected extension shell should show a clear unsupported-page recovery state when it runs on a Cloudflare dashboard area that is outside the Workers guide path. The previous smoke coverage focused on supported Workers pages and missing targets. This slice prevents unsupported Cloudflare dashboard sections from being misread as Workers overview or generic dashboard home.

## Goals

- Detect unsupported Cloudflare dashboard areas that are not part of the Workers guide path.
- Return `cloudflare.unsupported` page context for unsupported Cloudflare areas.
- Show the injected shell's existing `Unsupported page` recovery guidance in Chromium unpacked-extension smoke.
- Keep unsupported recovery visible even if the user checks the page after a prior confirmation or completion state.
- Preserve supported Workers overview, starter editor, deploy review, deploy result, and missing-target behavior.
- Keep the extension runtime Cloudflare-only and read-only.

## Non-goals

- No support for arbitrary websites beyond the existing extension manifest scope.
- No production Chrome Web Store packaging.
- No automatic navigation, clicking, deployment, DNS mutation, account write, or data persistence.
- No new extension permissions, storage APIs, backend service, or LLM runtime.
- No broad copy redesign or React content-script migration.

## UX Behavior

When the injected shell checks an unsupported Cloudflare dashboard section, such as a billing or analytics-style page, Michi should not show a Workers guide step. It should show:

- `Unsupported page`
- a short reason explaining that the current page is outside Michi's supported guide surface
- a recovery action that points the user back to Cloudflare Workers & Pages
- no target highlight

## Acceptance Criteria

- The page reader maps unsupported Cloudflare dashboard areas to `cloudflare.unsupported`.
- Global Cloudflare navigation text such as `Workers & Pages` must not make an unsupported dashboard area look like dashboard home.
- The injected shell displays unsupported recovery guidance in the browser extension smoke.
- Unsupported recovery overrides stale guide phases such as critical confirmation or completed state after a fresh page check.
- The unsupported state does not render a normal Workers guide step or target highlight.
- Existing supported Workers route smoke still passes.
- The slice does not add permissions, storage, external requests, host-page writes, or account mutations.

## Test Requirements

- `npm test -- tests/cloudflarePageReader.test.ts tests/injectedShell.test.ts`
- `npm run build:extension && npx playwright test tests/e2e/extension-runtime.spec.ts --project=chromium`
- `npm test`
- `npm run build`
- `npm run test:e2e`
- `git diff --check`
