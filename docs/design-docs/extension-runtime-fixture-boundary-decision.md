# Extension Runtime Fixture Boundary Decision

## Decision

Extract Cloudflare dashboard fixture generation from the extension runtime Playwright smoke into a dedicated test-support module. Keep the runtime smoke responsible for browser and extension behavior, and keep route-specific HTML in a fixture factory that can be unit-tested independently.

## Context

Michi's extension runtime is still validated through local unpacked Chromium smoke tests. Those tests must remain close to real browser behavior, but the current file mixes three responsibilities:

- loading the unpacked extension;
- asserting guide shell behavior;
- constructing all Cloudflare-like page states inline.

As Michi adds more supported routes and recovery cases, inline fixture HTML will make the smoke test harder to review and more likely to drift from the product contract.

## Rationale

- A fixture boundary makes future runtime tests smaller and easier to scan.
- Unit-testing fixture generation catches route markup regressions without launching Chromium.
- Keeping the fixture under `tests/support` prevents it from entering the extension production bundle.
- This is a low-risk slice because it does not change the content script, service worker, manifest, guide state, or selectors.

## Consequences

- E2E setup imports a test-only route handler.
- Fixture route names and HTML variants become a reusable test contract.
- Future real-site manual checks can be compared against fixture scenarios more clearly.
- If the route-state guard branch changes the same e2e smoke, this branch may need a small merge conflict resolution in the test setup section.

## Rollback

Inline the route fulfillment logic back into `tests/e2e/extension-runtime.spec.ts` and remove the fixture module and its unit tests. Runtime behavior would remain unchanged.
