# Extension Runtime Probe Boundary Decision

## Decision

Move extension runtime probe setup out of `tests/e2e/extension-runtime.spec.ts` into a dedicated test support module.

## Context

The extension runtime smoke is the durable proof that Michi can load as an unpacked Cloudflare-only extension, inject its guide rail, read page context, and communicate through the service worker. The test has grown to include Cloudflare fixture generation, runtime probe file generation, launch configuration, and user-visible guide assertions. Fixture generation has already been extracted; the next boundary is the runtime probe/setup layer.

## Rationale

- The E2E file should read like a user/runtime scenario, not a build-artifact writer.
- Probe asset generation is deterministic and can be covered by fast unit tests.
- Keeping launch args in one helper makes permission/runtime changes easier to review.
- This keeps the extension milestone local and reproducible without moving toward Chrome Web Store publication.

## Consequences

- Future runtime smoke cases can reuse the same probe installation and launch setup.
- The helper remains test-only code; production extension runtime is unchanged.
- This branch is stacked on the fixture-boundary branch until that slice lands in `main`.

## Rollback

Inline the helper calls back into `tests/e2e/extension-runtime.spec.ts` and remove the support module plus its unit tests. Michi app and extension runtime behavior would be unchanged.
