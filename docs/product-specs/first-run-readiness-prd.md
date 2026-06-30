# First-Run Readiness PRD

## Problem Statement

Michi now has a compact guide panel, page checks, recovery guidance, command handoff, activity history, and keyboard-safe panel behavior. A new evaluator opening Michi for the first time still has to infer whether the panel is ready, whether the current page can be checked, and whether starting a guide will remain local and reversible.

The product problem is first-run readiness: before the user starts a guide, Michi should show a compact checklist that explains the current setup state in Michi-owned language without turning the side panel into onboarding copy or a help center.

## Solution

Add a first-run readiness checklist to the existing side panel and injected shell. The checklist should show the minimum state needed to start safely:

- panel is active;
- page check can be triggered;
- local guide state is ready;
- current page is usable or needs a check/recovery.

The checklist should be visible before guide start. If an existing Check shortcut starts a guide from the current page, first-run readiness should disappear and the normal guide surface should take over. It stays inside the compact panel, uses the existing command handoff for actions, and keeps all runtime/provider details internal.

## User Stories

1. As a first-time user, I want to know Michi is active, so that I trust the panel is attached to the current page.
2. As a first-time user, I want to know whether page checking is available, so that I understand what the Check command does before starting.
3. As a first-time user, I want to know that guide state is local and recoverable, so that I can start without worrying about account changes.
4. As a first-time user, I want to see whether the current page is usable, so that I know whether to start the guide or check/recover first.
5. As a keyboard user, I want the checklist to appear without stealing focus from the primary input, so that first-run orientation does not slow entry.
6. As a mobile user, I want readiness to stay compact, so that Michi does not take over the host page.
7. As an evaluator, I want the first-run surface to avoid provider names and raw routes, so that Michi reads as the product rather than a dashboard wrapper.
8. As a maintainer, I want React and injected-shell readiness to share the same classification rules, so that the two surfaces do not drift.
9. As a maintainer, I want tests for ready, needs-check, and blocked states, so that readiness does not regress into stale status copy.

## Implementation Decisions

- Add a shared readiness presenter that derives product-language checklist items from the guide phase, host page state, panel state, and page-check availability.
- Render readiness in the intent/first-run area only, and keep command handoff as the place where users act.
- Preserve the existing Check shortcut that can start a guide from a usable page instead of keeping the user in first-run readiness.
- Treat blocked/recovery states as readiness warnings, not as a separate error taxonomy.
- Keep focus behavior unchanged: opening the panel still focuses the primary intent field.
- Keep visible copy provider-neutral. Runtime identifiers, route IDs, and provider-specific page labels remain internal adapter details.
- Do not add new storage, permissions, analytics, backend services, external account checks, or public publishing work.

## Testing Decisions

- Unit tests should cover readiness classification for ready, needs-check, blocked/recovery, and active-guide states.
- React component tests should verify the checklist appears on first open, remains compact, and does not replace the command handoff.
- Injected shell tests should verify the same readiness language appears inside the shadow panel and updates after Check.
- Browser smoke should cover the first-run checklist on desktop/mobile React flow and the unpacked runtime fixture.
- Product-only tests should continue rejecting provider-facing visible copy.

## Out of Scope

- No multi-step onboarding wizard.
- No user preferences, local storage, or dismissal persistence.
- No live account sign-in detection.
- No new browser permissions.
- No marketplace readiness, packaging, listing, or release submission.
- No backend service, database, telemetry, or analytics.
- No autonomous navigation or account writes.

## Further Notes

This slice is deliberately small. It makes the first-open state legible while preserving the current product shape: the host page remains primary, the Michi panel remains compact, and user action still flows through command handoff.
