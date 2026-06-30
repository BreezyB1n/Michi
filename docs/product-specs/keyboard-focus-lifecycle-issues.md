# Keyboard Focus Lifecycle Issue Breakdown

These issues are local planning records until the project label strategy is confirmed.

## Issue 1: Add React Workbench Focus Lifecycle

Type: AFK

Blocked by: None - can start immediately.

User stories covered: 1, 2, 3, 4, 6, 7, 8, 10.

What to build:

Make the React workbench guide panel manage focus after open, minimize, `Escape`, and reset while preserving existing guide state and compact rail behavior.

Acceptance criteria:

- [ ] Opening `Guide` focuses the panel's current primary entry point.
- [ ] Clicking `Minimize panel` returns focus to the rail `Guide` button.
- [ ] Pressing `Escape` collapses the panel without clearing guide state.
- [ ] Reset keeps the panel open and focuses the intent entry.
- [ ] Tests verify focus and panel state through user-facing interactions.

## Issue 2: Add Injected Shell Focus Restoration

Type: AFK

Blocked by: None - can start immediately.

User stories covered: 2, 3, 4, 5, 6, 7, 9.

What to build:

Extend the injected shell's existing `Escape` collapse behavior so focus moves to the rail `Guide` button after collapse and to the intent entry after reset. Opening the panel should focus the first useful panel control without clearing checked page context.

Acceptance criteria:

- [ ] Opening `Guide` focuses the intent entry when the shell is in intent phase.
- [ ] `Escape` collapses the shell and focuses the rail `Guide` button.
- [ ] `Minimize panel` collapses the shell and focuses the rail `Guide` button.
- [ ] Reset focuses the intent entry and clears only guide-local state.
- [ ] Shadow DOM tests verify focus without introducing new rail controls.

## Issue 3: Extend Browser Proof And Evidence Ledger

Type: AFK

Blocked by: Issues 1 and 2.

User stories covered: 5, 7, 8, 9, 10.

What to build:

Extend browser and execution-plan proof for the keyboard focus lifecycle slice.

Acceptance criteria:

- [ ] React browser smoke covers focus after open and collapse on desktop and mobile.
- [ ] Extension runtime smoke covers focus restoration inside the shadow panel.
- [ ] Product-copy guard still passes.
- [ ] No manifest, permission, storage, or package changes are introduced.
- [ ] Execution plan ledger records commands, results, and caveats.
