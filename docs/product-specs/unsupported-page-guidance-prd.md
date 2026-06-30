# Unsupported Page Guidance PRD

## Problem Statement

Michi can already detect recovery states such as unsupported pages, route mismatch, missing targets, and extension context failures. The current recovery UI explains that progress is blocked, but it still feels like a technical state readout. A user should understand what happened, why Michi paused, and exactly what to do next without needing provider-specific language or scanning multiple panel regions.

The product problem is recovery guidance: when the current page cannot support the active guide, Michi should turn that blocked state into a compact, actionable recovery card and a safe command handoff.

## Solution

Add productized unsupported-page guidance to the existing side panel and injected shell. The guidance should classify the recovery state, explain the impact, show one next action, and keep normal progress unavailable until a page check returns to the expected guide path.

The solution stays deterministic and local. It reuses the existing page check, recovery, command handoff, and product-copy boundaries. It does not add new extension permissions, storage, browser automation, backend services, public publishing work, or real account writes.

## User Stories

1. As a user, I want Michi to explain unsupported pages in product language, so that I know this is a recoverable guide state.
2. As a user, I want to see why the page blocks progress, so that I understand why normal guide actions are unavailable.
3. As a user, I want a single clear recovery action, so that I can return to a supported page and re-check.
4. As a user, I want target-missing guidance to tell me whether the page is still loading or on the wrong step, so that I can recover without resetting unnecessarily.
5. As a user, I want route-mismatch guidance to preserve my selected guide path, so that checking the wrong product area does not silently switch my goal.
6. As a user, I want runtime-read failures to look different from unsupported-page failures, so that I know whether to re-check or reload the extension.
7. As a keyboard user, I want recovery commands to keep focus predictable, so that I can recover without losing my place.
8. As a mobile user, I want recovery guidance to remain compact, so that Michi does not take over the host page.
9. As an evaluator, I want unsupported guidance to avoid provider names, routes, and raw URLs, so that the product surface remains Michi-owned.
10. As a maintainer, I want recovery classification to be shared by React and injected shell, so that the two surfaces do not drift.
11. As a maintainer, I want tests to prove recovery cannot be bypassed, so that unsupported-page guidance does not weaken the guide contract.

## Implementation Decisions

- Build a shared recovery guidance presenter that maps blocking state and checked page state into product-language copy.
- Keep recovery as a blocking phase. Normal advance and completion remain unavailable until the next page check returns usable evidence.
- Preserve the active guide path during route mismatch instead of switching paths based on the checked page.
- Keep target highlight hidden when the checked page belongs to the wrong path or lacks the expected target.
- Render the guidance inside the existing recovery area and command handoff rather than adding a modal, landing page, or global overlay.
- Keep both React workbench and injected shell using the same product copy shape where practical.
- Do not add new runtime permissions, storage, account mutation, remote fetches, or extension marketplace packaging.

## Testing Decisions

- Unit tests should cover unsupported page, target missing, route mismatch, and runtime unavailable guidance copy.
- Command handoff tests should prove recovery still recommends recovery/re-check and does not expose normal progress.
- React component tests should verify recovery guidance shows what happened, why it blocks progress, and the safe next action.
- Injected shell tests should verify the shadow panel shows the same product-language recovery guidance and keeps product-copy guards green.
- Browser smoke should cover unsupported/recovery guidance in desktop and mobile React flows and in the unpacked extension runtime.
- Existing product-only tests should reject provider-facing recovery copy.

## Out of Scope

- No public extension-store testing or publishing.
- No real provider account automation.
- No new host permissions or manifest scope changes.
- No autonomous navigation or writes.
- No backend service, database, analytics, or storage.
- No generalized multi-provider routing.
- No full troubleshooting center or help article system.

## Further Notes

This slice strengthens the current Sitegeist-style product shape: the host page stays primary, Michi stays compact, and blocked states become actionable guidance instead of technical errors. The work should build on the existing recovery, page-check, command handoff, and product-only UI boundaries.
