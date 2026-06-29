# Command Handoff Decision

## Decision

Michi will add a compact command handoff region inside the existing side panel. The handoff recommends the next safe action from guide state and reuses existing transitions. It is not a free-form command parser or an automation launcher.

## Context

The current shell has strong state visibility but still spreads the user's next decision across the guide step, page check, action bar, and activity history. A handoff region can make the product easier to operate while preserving the side-panel footprint.

## Rationale

- A state-derived recommendation is safer than accepting arbitrary commands in this milestone.
- Reusing existing handlers preserves recovery and confirmation safety.
- A compact recommendation aligns with embedded side-panel behavior and does not compete with the host page.
- Sharing the handoff model keeps React and injected shell output consistent.
- Product-only copy keeps runtime readers internal and prevents provider-shaped UI drift.

## Visual Direction

- Raycast: direct command naming and quick scannability.
- Linear: dense workflow state with calm hierarchy.
- Sitegeist-style side panel: compact embedded product surface.

The handoff should look like an operator note plus one clear command: small, legible, and visibly bounded from activity history.

## Consequences

- New action labels should be added through the handoff model, not scattered across each UI surface.
- The handoff must never make normal progress look available during confirmation or recovery.
- Browser proof must cover shadow-root copy, not only the React workbench.
- This slice does not change extension permissions, storage, runtime reader contracts, or account-write behavior.

## Non-Goals

- No global palette.
- No natural language parser.
- No command search.
- No keyboard shortcut capture.
- No persisted queue.
- No autonomous writes.
