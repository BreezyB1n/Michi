# Extension Provider Timeout Decision

## Decision

Add a timeout at the `ExtensionPageContextProvider` boundary. If the extension runtime does not invoke the `sendMessage` callback before the timeout, resolve with `unsupportedPageContext()` using an error severity and a timeout-specific reason.

## Context

The extension provider already converts unavailable runtime APIs, `lastError`, explicit `MICHI_PAGE_CONTEXT_ERROR`, invalid responses, and synchronous exceptions into controlled unsupported context. The missing failure mode is a runtime request that never calls back. In that case, `getCurrentContext()` never resolves, and the guide shell cannot show recovery copy.

## Rationale

- The provider is the right boundary because it owns extension runtime uncertainty before guide state consumes page context.
- A single timeout is simpler and safer than adding retry, polling, or long-lived connections before the product needs them.
- Returning unsupported context keeps the behavior consistent with other runtime failures.
- Making the timeout configurable lets tests run quickly without weakening the runtime default.

## Consequences

- `createExtensionPageContextProvider()` accepts optional timeout configuration.
- Provider tests use fake timers to prove timeout and late-callback behavior.
- Real runtime behavior becomes more deterministic under service-worker or content-script stalls.
- This does not prove live Cloudflare page stability; it only bounds the extension messaging failure mode.

## Rollback

Remove the timeout option, timer logic, and timeout tests. Existing successful and explicit-error messaging behavior would remain unchanged, but hung extension callbacks could again hang `Check page`.
