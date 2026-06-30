# Unsupported Page Guidance Decision

## Decision

Michi will productize unsupported-page and recovery states through a shared recovery guidance presenter. The presenter turns blocked page checks into product-language copy that explains what happened, why progress paused, and the next safe recovery action.

## Context

The current shell already detects unsupported pages, route mismatch, missing expected targets, and extension runtime failures. The UI can block progress safely, but recovery copy is spread across page state, blocking state, command handoff, and shell-specific helpers. This makes the behavior safe but less coherent.

## Rationale

- Recovery is a core product behavior, not just an error state.
- A shared presenter keeps React and injected shell language aligned.
- Keeping recovery blocking preserves confirmation and page-check safety.
- Product-only copy prevents the UI from turning back into a provider-specific dashboard helper.
- Using the existing panel avoids growing Michi into a modal, full-page app, or help center.

## Visual Direction

The recovery card should read like a compact operator note:

- short title;
- one reason line;
- one impact line;
- one recovery action;
- command handoff immediately below it.

It should be calmer than an error alert but more explicit than passive status text.

## Consequences

- Future recovery states should add copy through the presenter before appearing in UI.
- Tests should assert recovery copy by product behavior, not by provider route IDs.
- Runtime adapters may keep provider-specific route IDs internally, but visible recovery copy must sanitize them.
- Browser proof must cover the injected shell because that is the real extension-shaped surface.

## Non-Goals

- No autonomous navigation.
- No new extension permissions.
- No provider-specific visible troubleshooting copy.
- No full help-center taxonomy.
- No marketplace publishing work.
