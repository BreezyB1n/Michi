# Product Surface Decision

## Decision

Michi's visible UI is a product surface made of intent, guide, page check, action controls, recovery, evidence, and activity history. External workspace details are runtime inputs, not product navigation.

## Context

The product is moving from a local workbench toward an injected browser shell. That shell can read a supported host workspace through an internal adapter, but the user clarified that Michi UI should only be product-related. A provider can be useful proof data without becoming the visible product story.

## Rationale

- Michi's durable value is guidance, evidence, and recovery.
- A provider-shaped UI makes the product feel narrower than the architecture.
- Product-owned UI regions can be tested without coupling to selectors or route names.
- A compact activity timeline gives users confidence without occupying more host-page space.
- Keeping adapters internal avoids needless renaming while still protecting the user-facing surface.

## Consequences

- New frontend slices should start from Michi UI regions rather than external workspace screens.
- Active plans and current overview docs should avoid provider-framed UI language.
- Historical implementation docs can keep exact fixture details when needed.
- Product presentation remains the boundary between runtime inputs and visible copy.
- Activity history becomes the next product-owned region to implement.

## Non-Goals

- No new provider support.
- No storage, analytics, or backend.
- No live account writes.
- No public listing workflow.
- No broad permission expansion.
