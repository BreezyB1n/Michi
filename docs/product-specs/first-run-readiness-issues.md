# First-Run Readiness Issue Breakdown

These issues are local planning records until the project label strategy is confirmed.

## Issue 1: Add Shared Readiness Presenter

Type: AFK

Blocked by: None - can start immediately.

User stories covered: 1, 2, 3, 4, 8, 9.

What to build:

Create a shared product-language readiness presenter that derives first-run checklist items from panel state, guide phase, page check state, and recovery/blocking state.

Acceptance criteria:

- [x] Ready state includes panel active, page check available, guide state ready, and usable page signals.
- [x] Needs-check state explains that the user should run a page check before trusting page anchoring.
- [x] Recovery/blocked state marks the current page as needing recovery without exposing normal progress.
- [x] Active-guide state does not present first-run readiness as onboarding.
- [x] Unit tests cover all readiness classifications.

## Issue 2: Render React First-Run Readiness

Type: AFK

Blocked by: Issue 1.

User stories covered: 1, 2, 3, 4, 5, 6, 7.

What to build:

Render the readiness checklist inside the React side panel first-run area without moving focus away from the intent input or replacing command handoff.

Acceptance criteria:

- [x] Opening Michi shows readiness and intent entry together.
- [x] The checklist remains compact on desktop and mobile.
- [x] The primary focus still lands on the user intent field.
- [x] Ready and blocked states update after page checks.
- [x] Visible copy remains Michi-owned and provider-neutral.

## Issue 3: Render Injected Shell First-Run Readiness

Type: AFK

Blocked by: Issue 1.

User stories covered: 1, 2, 3, 4, 6, 7, 8.

What to build:

Render the same first-run readiness checklist in the injected shell shadow panel and update it when Check reads the page.

Acceptance criteria:

- [x] Opening the injected panel shows readiness before a guide starts.
- [x] Running Check from a usable page starts the guide and hides first-run readiness.
- [x] Recovery keeps readiness warning-oriented and keeps command handoff as the action surface.
- [x] The shell does not expose provider names, raw routes, broad permissions, Image controls, or Video controls.
- [x] Shadow DOM tests cover first-open readiness and Check handoff into the guide.

## Issue 4: Browser Proof And Merge Gate

Type: AFK

Blocked by: Issues 2 and 3.

User stories covered: 5, 6, 7, 9.

What to build:

Extend browser proof and the execution ledger for first-run readiness.

Acceptance criteria:

- [x] Desktop and mobile Playwright smoke covers first-open readiness.
- [x] Unpacked runtime smoke covers injected-shell readiness.
- [x] No horizontal overflow appears on desktop or mobile.
- [x] Execution plan ledger records commands, results, review, and caveats.
- [ ] Branch freshness, check wrapper, and local merge gates pass before PR.
