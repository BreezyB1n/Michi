# Extension Injected Full Path Smoke Decision

## Decision

Expand the Chromium unpacked-extension smoke fixture to cover every supported Workers guide route instead of adding new product runtime behavior.

## Context

The injected shell already maps `HostPageContext.routeId` to guide steps, reads page targets from Cloudflare-like DOM content, gates critical actions, and completes from Worker URL evidence. The browser smoke still jumped from overview to deployment result, which left the starter-editor and deploy-review route mappings under-proven in the extension runtime.

## Rationale

- The product risk is evidence quality, not missing domain code.
- Route-specific fixture pages prove the content-script page reader and injected shell work together across the guide path.
- Keeping this in Playwright avoids pretending Michi can create, deploy, or navigate Cloudflare resources.
- The change stays narrow and can be rolled back without touching extension permissions or production code.

## Consequences

- `tests/e2e/extension-runtime.spec.ts` owns the richer fixture pages and assertions.
- No new source runtime module is required unless the smoke exposes a real route-mapping defect.
- The browser proof becomes closer to the intended evaluator demo path.

## Rollback

Remove the starter-editor and deployment-review fixture branches and assertions from the extension runtime smoke. Existing overview, completion, and recovery coverage remains intact.
