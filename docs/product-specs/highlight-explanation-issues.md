# Highlight Explanation Issue Breakdown

These issues are local planning records until the project label strategy is confirmed.

## Issue 1: Add Target Callout Presenter

Type: AFK

Blocked by: None - can start immediately.

User stories covered: 1, 2, 4, 6, 7.

What to build:

Create a small presenter that turns a page target into product-language callout text and viewport-safe positioning.

Acceptance criteria:

- [x] A highlighted target produces a title, detail, accessible label, and position values for a fixed callout.
- [x] Missing bounding boxes produce no callout.
- [x] Product-language labels are used for visible text.
- [x] Unit tests cover normal, missing-target, and viewport-clamp cases.

## Issue 2: Render Injected Target Callout

Type: AFK

Blocked by: Issue 1.

User stories covered: 1, 2, 3, 4, 5, 6, 7.

What to build:

Render the callout with the injected highlight so the in-page anchor explains itself without blocking host-surface interaction.

Acceptance criteria:

- [x] Running Check on a supported target shows the highlight and callout together.
- [x] The callout is read-only and does not intercept host-surface clicks.
- [x] The callout refreshes with scroll and resize alongside the highlight.
- [x] Missing-target and recovery states remove the callout.
- [x] Visible copy remains product-owned and provider-neutral.

## Issue 3: Mirror The Explanation In The React Workbench

Type: AFK

Blocked by: Issue 1.

User stories covered: 1, 2, 5, 6.

What to build:

Add a compact host-preview explanation in the React workbench so the local browser surface demonstrates the same product concept as the injected shell.

Acceptance criteria:

- [x] The host preview names the highlighted target during guide flow.
- [x] Completion and recovery states do not show stale target explanation.
- [x] The side panel footprint does not grow.
- [x] Component tests cover normal and recovery behavior.

## Issue 4: Browser Proof And Merge Gate

Type: AFK

Blocked by: Issues 2 and 3.

User stories covered: 3, 4, 5, 7.

What to build:

Extend browser proof and execution ledger for target callouts.

Acceptance criteria:

- [x] Desktop and mobile Playwright smoke covers React target callout visibility and containment, and desktop unpacked runtime smoke covers injected callout viewport bounds.
- [x] Unpacked runtime smoke covers injected callout behavior.
- [x] No horizontal overflow appears on desktop or mobile.
- [x] Execution plan ledger records commands, results, review, and caveats.
- [ ] Branch freshness, check wrapper, and local merge gates pass before PR.
