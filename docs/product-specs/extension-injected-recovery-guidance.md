# Extension Injected Recovery Guidance

## Summary

Michi's injected extension shell should explain recoverable anchoring failures inside the compact panel. When the page reader can identify a Cloudflare route but cannot find the expected target for that route, the shell displays a small recovery callout with the cause and the next manual action. This keeps the extension useful when the host page drifts, loads partially, or the evaluator is on the right product area but not the exact expected state.

## Goals

- Detect when a known Cloudflare route is missing its expected page target.
- Detect unsupported page contexts reported by the reader.
- Show concise recovery copy in the injected panel after `Check page`.
- Avoid drawing a target highlight when no reliable target bounding box exists.
- Keep the shell deterministic and local.

## Non-goals

- No automatic navigation, clicking, or DOM mutation inside Cloudflare.
- No persisted recovery state.
- No guide-core phase synchronization from the injected shell.
- No new extension APIs, permissions, or packaging changes.

## UX Behavior

When `Check page` succeeds with an anchorable target, the panel keeps the current route, location, target, evidence, and highlight behavior.

When `Check page` returns a known route without the expected target, the panel shows:

- `Target missing`
- the expected target label
- why this blocks the next guide action
- a manual recovery action, such as opening Workers & Pages and checking again

When the reader reports `cloudflare.unsupported`, the panel shows:

- `Unsupported page`
- that Michi only reads Cloudflare dashboard pages in this milestone
- a manual recovery action to open the Cloudflare dashboard

## Acceptance Criteria

- The injected rail still contains only `Guide` and `Check page`.
- The panel displays recovery guidance for unsupported or target-missing contexts.
- The panel does not render a target highlight without a target bounding box.
- Normal anchorable contexts still render the existing route, target, evidence, and highlight.
- Unit and Playwright coverage exercise both normal and missing-target paths.
