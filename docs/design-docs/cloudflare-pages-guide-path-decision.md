# Cloudflare Pages Guide Path Decision

## Decision

Promote `static-site` intent from a terminal acknowledgement into a deterministic Cloudflare Pages guide path, while keeping Workers as the backend/API guide path.

## Context

Michi's clarification step asks whether the user is building backend/API logic or a static website. Until now, backend/API entered the Workers guide while static-site returned a short Pages capability explanation and stopped. That made the clarification truthful but not actionable for static website users.

## Rationale

- A guide agent should turn a path-changing clarification into a path, not a dead end.
- Pages can reuse the existing reducer, step, page-context, confirmation, completion, recovery, and extension smoke architecture.
- The path remains deterministic and local, so it does not add account writes or browser permissions.
- Keeping `serviceKind` as the path discriminator avoids a full injected-shell state rewrite.

## Consequences

- The site skill pack owns both Workers and Pages guide steps.
- Page context helpers must understand Pages route IDs and target labels.
- The injected shell compact state needs `serviceKind` so reducer projections reconstruct the correct session.
- Static-site tests that previously expected immediate completion now expect a Pages guide path.

## Rollback

Restore `static-site` routing to the previous `static-complete` acknowledgement, remove Pages route detection and Pages-specific tests, and keep Workers behavior unchanged. No user data, extension permissions, storage, or Cloudflare resources require rollback.
