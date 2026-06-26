# Extension Injected Unsupported Hardening Decision

## Decision

Classify unsupported Cloudflare dashboard areas as `cloudflare.unsupported` in the page reader and reuse the injected shell's unsupported recovery guidance. Dashboard home detection is path-based; global navigation text alone is not sufficient evidence that the user is on a supported guide surface.

## Context

The extension content script only runs on `https://dash.cloudflare.com/*`, so non-Cloudflare websites are outside the injected shell runtime. Inside Cloudflare, unsupported sections can still be opened. Before this slice, a generic Cloudflare dashboard page could fall back to `cloudflare.dashboard.home` or inherit fixture text that made it look like Workers overview.

## Rationale

- Unsupported page feedback is safer than showing a misleading Workers step.
- The existing `cloudflare.unsupported` route already avoids guide-step mapping and target highlight.
- Reusing the existing recovery surface keeps the slice small and avoids new UI state.
- Rendering unsupported recovery before stale guide phases prevents prior confirmation or completion state from masking the fresh page check.
- The fix stays local to page understanding and browser smoke coverage.

## Consequences

- `cloudflarePageReader` distinguishes supported dashboard home from unsupported Cloudflare dashboard sections.
- Unsupported Cloudflare areas produce a controlled unsupported signal.
- Browser smoke verifies the user-facing recovery state.
- Component coverage verifies unsupported recovery after stale confirmation and completion phases.
- No manifest, permission, storage, or action automation changes are needed.

## Rollback

Remove the unsupported Cloudflare area detection branch and the unsupported-area smoke assertions. Supported Workers route mapping, completion, and recovery coverage remain intact.
