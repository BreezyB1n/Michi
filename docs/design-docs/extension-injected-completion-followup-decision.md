# Extension Injected Completion Follow-up Decision

## Decision

Model Workers guide completion as a local injected-shell phase that is entered only after page context confirms the final Worker URL step.

## Context

The local React app already completes the primary Workers path and recommends Cloudflare DNS. The injected shell can start a guide, check page context, show guide semantics, navigate steps, recover from missing targets, and require critical-action confirmation. It still cannot finish the guide inside the page-attached surface.

## Rationale

- Completion is part of the original Guide Loop contract, not a separate product mode.
- The existing page reader already emits `cloudflare.workers.deploy-result`, `worker-url`, and a success signal, so no new runtime boundary is needed.
- Gating completion on page evidence keeps Michi honest: local step navigation alone cannot claim that a Worker URL works.
- DNS remains a follow-up recommendation, not an automated account mutation.

## Consequences

- `src/extension/injectedShell.ts` gets a local `complete` phase.
- The final guide step can render a `Complete guide` action when Worker URL evidence is present.
- `Complete guide` renders the Cloudflare DNS follow-up route.
- No host-page event, extension permission, or storage API is added.

## Rollback

Remove the local completion phase and restore the final guide step to a disabled final navigation state. Session start, page check, guide navigation, target highlight, recovery guidance, and critical confirmation remain intact.
