# Runtime Context Boundary Decision

## Decision

Michi should treat provider-specific page reading as an adapter implementation detail. Product UI, guide state, recovery copy, completion evidence, and tests that assert visible behavior should use provider-neutral Michi language and the shared page-understanding vocabulary.

## Context

The side-panel shell now presents Michi as the product, but the runtime was originally built around one supported provider fixture. That was appropriate for proving page anchoring, target highlights, and deterministic guide behavior. The next frontend milestones need a cleaner boundary so Michi can add supported products without rewriting the shell or leaking provider names into visible UI.

## Rationale

- The product surface should remain stable while provider readers evolve.
- Provider selectors, route IDs, and fixture HTML are high-churn details.
- `HostPageContext`, `PageTarget`, `PageSignal`, and `BlockingState` are already the durable vocabulary that the guide core understands.
- A narrow adapter boundary lets the extension runtime keep real browser proof while the React workbench keeps deterministic fixtures.
- Permission strategy should remain separate from runtime refactoring; no host permission widening is needed to extract the boundary.

## Consequences

- The current provider reader remains valid, but it becomes the first adapter rather than the product architecture.
- Product copy sanitization remains a required rendering boundary.
- Tests should separate adapter correctness from shell rendering behavior.
- Future provider support should add adapters and fixture proof before changing product UI or manifest scope.

## Non-Goals

- No new provider integration.
- No all-host permissions.
- No public extension distribution.
- No new backend, database, or LLM runtime.
- No change to critical-action confirmation semantics.
