# First-Run Readiness Decision

## Decision

Michi will show a compact first-run readiness checklist inside the existing side panel. The checklist explains whether the panel is active, page checks are available, guide state is ready, and the current page is usable or needs recovery.

## Context

The current first-open surface starts directly with intent entry and command handoff. That is efficient for repeated use, but it gives first-time evaluators little confidence that Michi is attached, local, and safe before a guide starts.

## Rationale

- Readiness should be visible before the first guide action, not buried in a troubleshooting state.
- A checklist is compact enough for the side-panel product shape.
- Shared readiness copy keeps React and injected shell aligned.
- Keeping readiness in the panel avoids a modal, landing page, or onboarding wizard.
- The command handoff remains the action surface, so readiness does not create a second control model.

## Visual Direction

The checklist should read like a small system note:

- short section label;
- four concise rows;
- status tone per row;
- no long instructions;
- no provider-specific details.

It should support scanning, not teaching.

## Consequences

- Future first-run checks should go through the shared readiness presenter.
- Tests should assert readiness by user-visible product behavior.
- Runtime adapters may keep provider details internally, but readiness copy must stay provider-neutral.
- The checklist should not require persistence or user profile state.

## Non-Goals

- No onboarding wizard.
- No storage-backed dismissal.
- No new permissions.
- No live account checks.
- No publishing or marketplace readiness work.
