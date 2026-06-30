# Unsupported Page Guidance Issue Breakdown

These issues are local planning records until the project label strategy is confirmed.

## Issue 1: Add Shared Recovery Guidance Copy

Type: AFK

Blocked by: None - can start immediately.

User stories covered: 1, 2, 3, 4, 5, 6, 9, 10.

What to build:

Create a shared product-language recovery guidance presenter for unsupported pages, route mismatch, missing expected targets, and runtime-read failures.

Acceptance criteria:

- [x] Unsupported pages produce a product-language title, reason, impact, and recovery action.
- [x] Route mismatch guidance preserves the selected guide path and does not suggest switching automatically.
- [x] Target-missing guidance explains loading/wrong-step recovery without exposing provider text.
- [x] Runtime-read failure guidance explains that Michi could not read the active page and should be re-checked.
- [x] Unit tests cover all supported recovery classifications.

## Issue 2: Render React Recovery Guidance

Type: AFK

Blocked by: Issue 1.

User stories covered: 1, 2, 3, 7, 8, 9, 11.

What to build:

Update the React side panel recovery section to show the shared guidance as an actionable blocked-state card, while preserving existing command handoff and focus behavior.

Acceptance criteria:

- [x] Recovery shows what happened, why it blocks progress, and what to do next.
- [x] Normal advance remains unavailable during recovery.
- [x] Recover/re-check uses the existing recovery path.
- [x] Copy stays compact on desktop and mobile.
- [x] Product-copy tests cover visible and accessible recovery text.

## Issue 3: Render Injected Shell Recovery Guidance

Type: AFK

Blocked by: Issue 1.

User stories covered: 1, 2, 3, 5, 7, 8, 9, 10, 11.

What to build:

Update the injected extension panel to render the same recovery guidance inside the shadow DOM without widening the rail or exposing provider-shaped controls.

Acceptance criteria:

- [x] Unsupported, route mismatch, and target-missing states show product-language recovery guidance.
- [x] Command handoff remains the only forward path during recovery.
- [x] The panel does not expose Image, Video, provider names, raw routes, or raw generated URLs.
- [x] Shadow DOM tests cover recovery copy and command safety.

## Issue 4: Extend Browser Proof And Evidence Ledger

Type: AFK

Blocked by: Issues 2 and 3.

User stories covered: 7, 8, 9, 11.

What to build:

Extend browser proof and the execution ledger for unsupported-page guidance.

Acceptance criteria:

- [x] Desktop and mobile Playwright smoke covers recovery guidance.
- [x] Unpacked extension runtime smoke covers recovery guidance in the injected shell.
- [x] No horizontal overflow appears on desktop or mobile.
- [x] Execution plan ledger records commands, results, and caveats.
- [x] Branch freshness, check wrapper, and local merge gates pass before PR.
