# Command Handoff Issue Breakdown

These issues are local planning records until the project label strategy is confirmed.

## Issue 1: Add Command Handoff Domain Model

Type: AFK

Blocked by: None - can start immediately.

User stories covered: 1, 2, 3, 4, 5, 9, 10.

What to build:

Create a typed command handoff model that derives the recommended primary action and safe secondary actions from the guide session.

Acceptance criteria:

- [ ] The model returns product-language command title, detail, tone, and action ID.
- [ ] Intent, clarify, guide, confirm, recovery, and complete phases have deterministic command output.
- [ ] Confirm phase does not expose normal advance as the primary action.
- [ ] Recovery phase does not expose normal advance as the primary action.
- [ ] Unit tests cover all guide phases and reset-ready output.

## Issue 2: Render React Command Handoff

Type: AFK

Blocked by: Issue 1.

User stories covered: 1, 2, 3, 4, 5, 6, 7, 8.

What to build:

Add a compact handoff section to the React side panel that shows the current recommendation and lets the user trigger existing guide actions.

Acceptance criteria:

- [ ] The handoff appears inside the expanded side panel without changing the collapsed rail footprint.
- [ ] The primary command invokes the same handler as the existing action bar.
- [ ] Secondary actions remain limited and do not duplicate unsafe progress.
- [ ] Long command copy wraps inside the panel.
- [ ] Product-copy tests cover visible and accessible handoff text.

## Issue 3: Render Injected Shell Handoff

Type: AFK

Blocked by: Issue 1.

User stories covered: 1, 2, 3, 4, 5, 7, 8, 9.

What to build:

Render a small handoff summary in the injected extension panel using the same command model, while keeping the panel width and host-page non-interference unchanged.

Acceptance criteria:

- [ ] The injected shell shows the recommended handoff in intent, guide, confirm, recovery, and complete states.
- [ ] Confirm and recovery commands invoke existing shell actions.
- [ ] Shadow-root product-copy checks include handoff text and accessibility labels.
- [ ] The handoff does not add Image, Video, or provider-shaped controls.

## Issue 4: Extend Browser Proof And Evidence Ledger

Type: AFK

Blocked by: Issues 2 and 3.

User stories covered: 6, 7, 8, 10.

What to build:

Extend browser and execution-plan proof for the command handoff slice.

Acceptance criteria:

- [ ] Desktop and mobile browser smoke covers the handoff across guide, recovery, confirmation, and completion states.
- [ ] Extension runtime smoke covers the injected handoff in the shadow panel.
- [ ] No horizontal overflow appears on desktop or mobile.
- [ ] Execution plan ledger records commands, results, and caveats.
- [ ] Branch freshness and check wrapper pass before merge.
