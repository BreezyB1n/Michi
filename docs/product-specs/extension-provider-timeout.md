# Extension Provider Timeout

## Summary

Michi's extension page context provider should recover when the browser extension runtime accepts a `MICHI_GET_PAGE_CONTEXT` request but never calls the response callback. Without a timeout, a `Check page` action can hang indefinitely and never show recovery guidance.

This slice adds a bounded timeout to the provider boundary so runtime stalls become controlled unsupported page context, matching the existing behavior for explicit runtime errors and missing extension APIs.

## Goals

- Resolve `getCurrentContext()` with controlled unsupported context when extension messaging does not respond.
- Preserve successful `MICHI_PAGE_CONTEXT` behavior.
- Preserve existing handling for `chrome.runtime.lastError`, explicit `MICHI_PAGE_CONTEXT_ERROR`, invalid responses, missing runtime, and synchronous exceptions.
- Make the timeout configurable for tests while keeping a conservative default for runtime use.
- Avoid leaking timers or resolving twice if a late extension callback arrives after timeout.

## Non-goals

- No manifest, permission, content script, service worker, message-contract, guide reducer, or UI layout changes.
- No automatic retry loop.
- No background polling or long-lived extension connection.
- No real Cloudflare network access or account writes.

## User-Visible Behavior

When a user presses `Check page` and the extension runtime does not return page context, Michi should leave the browser responsive and show the same unsupported/recovery style used for other extension context failures.

The recovery signal should explain that the extension context request timed out rather than silently hanging.

## Acceptance Criteria

- A provider whose runtime never calls the callback resolves to `cloudflare.unsupported`.
- The unsupported signal has `severity: "error"` and names the timeout.
- A late callback after the timeout does not replace the already resolved context.
- A successful response before the timeout still returns the original `HostPageContext`.
- Existing runtime failure and exception behavior remains covered.
- No production extension files change.

## Test Requirements

- `npm test -- tests/extensionPageContextProvider.test.ts`
- `npm test`
- `npm run build`
- `npm run test:e2e`
- `git diff --check`
- `bash /Users/bytedance/.agents/skills/check/scripts/run-tests.sh`
