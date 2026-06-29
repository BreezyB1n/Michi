# Product-Only UI Boundary PRD

## Problem Statement

Michi's current shell is visually close to the intended product form, but the repo still contains specs, status copy, and regression gates that can let a supported provider become the visible product story. The user clarified that Michi UI should only be product-related; provider names and provider-specific features are implementation details, not UI content.

From the user's perspective, Michi should appear as a compact page guide agent. It should explain what it sees, what the user should do next, what evidence passed, and how to recover. It should not make the evaluator think the product is a provider-specific dashboard helper.

## Solution

Create an explicit product-only UI boundary for React and injected extension surfaces.

The visible shell should use Michi-owned language for capabilities, page checks, recovery, completion, and follow-up routes. Provider-specific terms may remain in adapters, readers, fixtures, route IDs, tests that assert adapter behavior, and historical docs, but any text that can appear in the React workbench, injected shell, browser smoke, aria labels, placeholders, titles, status overview, or active plan must use Michi product language.

This PRD does not remove the current provider adapter. It hardens the presentation boundary so future frontend slices do not drift back into provider-branded UI.

## User Stories

1. As a demo evaluator, I want the side panel to read as Michi, so that I evaluate the product and not a single provider integration.
2. As a user, I want page checks to describe the current page in product language, so that I understand the guide state without knowing provider product names.
3. As a user, I want recovery states to explain what changed and how to continue, so that I can get back to the guide path without provider-specific jargon.
4. As a user, I want completion evidence to stay visible but provider-neutral, so that a generated URL or raw route ID does not leak into the product surface.
5. As a user, I want capability names to describe intent-level outcomes, so that backend service, site publishing, and custom-domain follow-up remain understandable.
6. As a mobile user, I want the compact shell to keep product labels short, so that drawer controls and evidence text do not overflow.
7. As a product designer, I want status and specs to name the product boundary directly, so that future UI work does not reintroduce provider framing.
8. As a frontend engineer, I want a single regression helper for product-only visible copy, so that React, injected shell, and browser tests enforce the same rule.
9. As a frontend engineer, I want provider-specific fixtures to remain available for adapter tests, so that implementation proof does not depend on real accounts.
10. As a maintainer, I want issue publication held until the label strategy is explicit, so that AFK-ready issues do not appear without the intended triage label.

## Implementation Decisions

- Treat `productPresentation` as the copy boundary for provider-shaped context before rendering.
- Keep provider-specific route IDs, selectors, and fixture text inside adapter and test-support layers.
- Add a source-level regression test for user-facing docs and app/injected-shell source strings that should not contain provider-branded UI framing.
- Update execution status copy to describe Michi as an injected product shell with a narrow supported-provider adapter, rather than as a provider-only product.
- Keep extension permissions and provider adapter names unchanged. Renaming internal adapter files is out of scope because it would add churn without changing user-visible behavior.
- Keep issue publication local for this PRD until the repository has an approved `ready-for-agent` label or an alternative label strategy.

## Testing Decisions

- Product-copy tests should scan rendered text plus common accessibility attributes: `aria-label`, `title`, `alt`, and `placeholder`.
- Component tests should continue driving real user flows instead of asserting implementation internals.
- Injected shell tests should scan the Shadow DOM after guide, recovery, confirmation, and completion states.
- E2E tests should keep desktop and mobile product-copy checks alongside no-overflow checks.
- A focused source/documentation guard should fail when active status or current product-boundary docs use provider names as visible UI framing.

## Out of Scope

- No provider adapter rewrite.
- No new supported provider.
- No manifest permission widening.
- No public extension listing or store publishing.
- No Chrome Side Panel API migration.
- No live account writes or automation.
- No visual redesign beyond copy and boundary hardening.

## Further Notes

This PRD narrows the next frontend slice. It follows the existing runtime context boundary but makes the user-facing rule sharper: provider-specific implementation can exist, but Michi UI itself should only describe Michi product concepts.
