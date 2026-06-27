# Extension Page Context Harness Decision

## Decision

Move service-worker active-tab page-context reads into `tests/support/extensionRuntimeHarness.ts`.

## Context

Michi's extension runtime proof depends on the service worker asking the active Cloudflare tab for page context through the existing `MICHI_GET_PAGE_CONTEXT` message. The E2E smoke currently inlines that sequence. The runtime probe and launch setup have already moved into the harness, so the remaining Chrome API plumbing should live at the same test-support boundary.

## Rationale

- E2E tests should read as browser scenarios, not repeated Chrome API adapters.
- The message contract and missing-active-tab failure can be covered with fast unit tests.
- A single helper makes future runtime smokes less likely to diverge from the supported page-context read path.
- The change keeps this milestone scoped to local unpacked-extension verification.

## Consequences

- The support module now owns runtime launch, probe assets, probe URL building, and active-tab page-context requests.
- Production extension runtime remains unchanged.
- This branch remains stacked on the runtime-probe boundary branch until the previous slices land.

## Rollback

Inline the helper call back into `tests/e2e/extension-runtime.spec.ts` and remove the new unit tests. Product behavior and extension permissions would be unchanged.
