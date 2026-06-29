# Product Surface Issue Breakdown

These issues are local planning records until the project label strategy is confirmed.

## Issue 1: Lock Current Product Surface Docs

Update current architecture and frontend docs so they describe Michi-owned UI regions rather than external workspace flows.

Acceptance criteria:

- `ARCHITECTURE.md` describes Product Shell UI, Guide Agent Core, Product Skill Pack, and Runtime Page Understanding.
- `docs/FRONTEND.md` describes collapsed rail, expanded guide panel, page check, evidence, recovery, and activity history.
- Current-facing docs pass the product-only copy guard.

## Issue 2: Add Activity Event Domain Model

Introduce a typed local event model for session history.

Acceptance criteria:

- Events cover intent start, path choice, page check, critical confirmation request, confirmation, recovery, completion, and reset.
- Events have stable IDs or deterministic sequence numbers.
- Event tone is one of `info`, `success`, `warning`, or `error`.
- Unit tests prove event ordering and reset behavior.

## Issue 3: Render Compact Activity Timeline

Add a compact timeline region to the expanded Michi panel.

Acceptance criteria:

- Timeline shows latest session events without expanding the panel footprint.
- Empty state is product-language only.
- Desktop and mobile layouts avoid horizontal overflow.
- Timeline text passes rendered product-copy checks.

## Issue 4: Wire Timeline To Guide Actions

Project existing guide actions into activity events.

Acceptance criteria:

- Start, choose path, check, recover, confirm, complete, and reset actions create the expected events.
- Critical confirmation cannot be represented as completed until the user confirms.
- Recovery events explain what changed and how Michi got back on track.

## Issue 5: Extend Browser Proof

Verify the product surface in real browser flows.

Acceptance criteria:

- Browser proof covers collapsed rail, expanded panel, start, path choice, page check, recovery, confirmation, completion, and reset.
- The timeline remains readable on desktop and mobile.
- No visible provider-framed copy appears in the product shell.
