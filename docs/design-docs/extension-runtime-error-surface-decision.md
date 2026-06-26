# Extension Runtime Error Surface Decision

## Decision

Treat extension runtime failures as a first-class recovery state in the provider-driven guide UI, while keeping the provider contract as `HostPageContext`.

## Context

The extension provider already fails closed by returning `cloudflare.unsupported` with an `extension-context-unavailable` signal. This is safe, but the UI can make the cause look like a generic unsupported page. For extension testing and later real usage, Michi needs to distinguish "this page is outside the guide surface" from "the extension could not read the active tab."

## Rationale

- A valid `HostPageContext` keeps Guide Core deterministic and avoids throwing through React UI code.
- A specific blocking state gives the user a recovery path without broadening extension permissions.
- Keeping retry on manual `Run check` avoids background polling and hidden page reads.
- Browser smoke and service-worker tests should cover the actual extension messaging failure boundary, not only provider unit tests.

## Consequences

- `GuideCore` can map extension runtime unavailable signals to a recovery phase.
- The UI can show a precise title/reason/recovery action.
- Extension behavior remains read-only and Cloudflare-only.
- The injected shell still uses `Unsupported page` for Cloudflare routes outside the Workers guide; it does not attempt to render on origins where no content script is installed.

## Rollback

Remove the extension-runtime-specific blocking-state mapping and browser smoke assertion. Provider fallback to generic unsupported context remains available.
