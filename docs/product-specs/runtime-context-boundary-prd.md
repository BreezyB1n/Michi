# Runtime Context Boundary PRD

## Problem Statement

Michi now looks like a product-level side panel, but the runtime internals still expose one provider-shaped path as the default mental model. This makes the next frontend stages harder to reason about: tests, fixtures, extension readers, and shell state can accidentally couple product behavior to a single demo provider instead of to Michi's page-understanding contract.

From the user's perspective, Michi should feel like a guide agent that can sit on top of supported web products. Provider-specific readers can remain as adapters, but product logic should not depend on provider names, provider route IDs, or demo fixture copy. The next milestone should turn the current provider-specific runtime into an adapter-backed page context boundary that keeps the visible shell and guide state provider-neutral.

## Solution

Introduce a runtime context boundary that separates Michi product behavior from provider-specific page readers and demo fixtures.

The user-facing shell keeps the current side-panel interaction model: collapsed rail, explicit page check, page target highlight, recovery, confirmation, and completion evidence. Under that shell, Michi routes all page observations through a provider-neutral adapter contract. The existing provider reader becomes the first adapter, not the product architecture.

This PRD does not require new live provider automation. It makes the current local runtime easier to extend and safer to test before adding new supported sites or broader extension permissions.

## User Stories

1. As a demo evaluator, I want Michi's side panel to describe the current page in product language, so that I can judge Michi instead of a provider integration.
2. As a demo evaluator, I want page checks to keep working on the current supported fixture, so that this refactor does not regress the existing guide path.
3. As a demo evaluator, I want unsupported pages to explain the runtime limitation without provider-specific product names, so that the recovery state feels like Michi behavior.
4. As a user, I want the guide path to remain stable when page context is refreshed, so that a runtime refactor does not reset my progress.
5. As a user, I want target highlighting to remain tied to the current page target, so that Michi still points at the right control after a page check.
6. As a user, I want critical write actions to keep requiring explicit confirmation, so that runtime context cannot bypass safety.
7. As a user, I want completion evidence to stay readable and provider-neutral, so that a generated URL or raw route ID does not leak into the product surface.
8. As a product designer, I want demo fixtures to be clearly marked as fixtures, so that product screens are not designed around fixture names.
9. As a frontend engineer, I want provider-specific readers isolated behind an adapter interface, so that adding another supported product does not require rewriting shell state.
10. As a frontend engineer, I want a shared context-normalization layer, so that React workbench and injected shell render the same product concepts.
11. As a frontend engineer, I want adapter tests that prove route, target, signal, blocking state, and evidence mapping, so that adapter behavior can change without breaking shell code.
12. As a frontend engineer, I want extension smoke tests to remain end-to-end, so that adapter extraction does not create a purely mocked proof.
13. As a frontend engineer, I want fixture helpers outside the product runtime path, so that runtime code is not shaped by test HTML.
14. As a maintainer, I want manifest permissions to stay narrow, so that this milestone does not accidentally become a store-publishing or all-host-permission project.
15. As a maintainer, I want a clear execution plan and evidence ledger, so that each follow-up branch can be reviewed as a small vertical slice.
16. As a future AFK agent, I want independently grabbable issues, so that each slice has a clear acceptance test and does not require private context from this conversation.

## Implementation Decisions

- Add a provider-neutral runtime context boundary around page reading. The boundary should describe adapters, supported routes, targets, signals, and failure states without visible provider language.
- Keep the existing supported provider reader as the first concrete adapter. The adapter may still contain provider-specific selectors, routes, and fixture knowledge.
- Preserve `HostPageContext`, `PageTarget`, `PageSignal`, and `BlockingState` as the core page-understanding vocabulary unless a slice proves a missing field.
- Keep `productPresentation` as the visible-copy boundary. Adapter output must pass through product presentation before it reaches the React side panel or injected shell.
- Keep manifest permissions unchanged in this milestone. Permission expansion requires a separate product spec and explicit review.
- Keep real extension proof separate from local React proof. The React workbench can use deterministic mocks; the extension smoke must still load the unpacked extension against fixture pages.
- Treat issue publication as a workflow step after the issue breakdown is approved. The GitHub repo has issues enabled, but the `ready-for-agent` label is not configured yet.

## Testing Decisions

- Tests should assert user-visible behavior rather than internal implementation details where practical.
- Adapter unit tests should cover normal context, unsupported context, route mismatch, missing target, success evidence, and provider failure.
- Product-copy tests should assert that visible shell text avoids provider terms even when adapter input contains provider route IDs or generated provider URLs.
- React component tests should cover collapsed rail, guide open, page check, recovery, confirmation, completion, and state preservation across check/minimize/open.
- Injected shell tests should cover the same shell phases through Shadow DOM and real document fixtures.
- Playwright smoke should cover desktop and mobile side-panel behavior, no horizontal overflow, provider-neutral visible copy, and action bar visibility.
- Extension runtime smoke should continue building `dist-extension`, loading the unpacked extension, and reading context through the content script.

## Out of Scope

- No new provider integration in this PRD.
- No all-host extension permissions.
- No Chrome Side Panel API migration.
- No store publishing or public extension listing.
- No live account writes.
- No backend service, database, LLM runtime, or remote browser automation.
- No replacement of the guide reducer or guide path semantics unless required by the adapter boundary.

## Further Notes

This is the next natural slice after the Sitegeist-style product shell. The shell now looks provider-neutral; this milestone makes the runtime architecture match that product shape.

The main risk is over-generalizing too early. The first implementation should extract only the boundary needed to keep current behavior provider-neutral and testable.
