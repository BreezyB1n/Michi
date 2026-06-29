# Product-Only UI Boundary Decision

## Decision

Michi's visible UI should only describe Michi product concepts. Provider names, provider-specific product surfaces, provider route IDs, provider-generated domains, and fixture/demo language are internal implementation details and should not appear in the React workbench, injected shell, accessibility labels, current execution status, or active product-boundary plans.

## Context

The current runtime can read one supported provider through a narrow adapter. That adapter is useful for local and extension proof, but the user clarified that Michi's product should not be presented as provider-specific UI. This is stricter than the previous runtime context boundary: not only should rendered copy be sanitized, current planning and status docs should also avoid turning a provider into Michi's product identity.

## Rationale

- The durable product is the guide agent, not the first supported provider.
- Provider-specific text is high churn and makes the UI harder to extend.
- Michi already has product-level concepts: guide, page check, target, evidence, recovery, service runtime, site publishing, and custom domain.
- Keeping adapters provider-specific is cheaper and more honest than pretending the runtime already supports every product.
- Current-facing docs influence future UI decisions, so they need the same product-boundary language as the shell.

## Consequences

- Provider-specific adapter names and fixture tests remain valid.
- Product presentation remains the rendering boundary for provider-shaped context.
- New UI work should add product-copy tests before changing visible copy.
- Historical specs can keep provider details when they document earlier milestones, but active/current docs should use Michi product language.
- Broader provider support still requires a separate PRD and permission review.

## Non-Goals

- No new provider integration.
- No internal adapter renaming for cosmetic reasons.
- No manifest permission widening.
- No store publishing.
- No live automation or account writes.
