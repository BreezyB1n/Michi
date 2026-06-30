# Highlight Explanation PRD

## Problem Statement

Michi can already draw a target highlight after a page check, and the side panel can describe the active step, target, and evidence. The in-page highlight itself is still visually ambiguous: a first-time user can see an outline, but may not understand why it appeared, what it points to, or whether it is safe to ignore.

The product problem is highlight explanation: Michi should make the highlighted target self-explanatory without turning the host surface into a tutorial layer or expanding the side panel footprint.

## Solution

Add a compact in-page target callout that appears with the highlight. The callout should name the target, state that Michi is checking it for the active guide step, and keep interaction read-only. It should stay attached to the highlighted target as the target refreshes and should disappear whenever the highlight disappears.

## User Stories

1. As a first-time user, I want the highlighted target to say what it is, so that I know why Michi drew attention to it.
2. As a guide user, I want the highlight explanation to connect to the current step, so that I understand the next action without rereading the whole panel.
3. As a host-surface user, I want the callout to avoid blocking clicks, so that the host surface remains primary.
4. As a keyboard user, I want the callout to expose useful accessible text, so that the highlighted target is not a purely visual cue.
5. As a mobile user, I want the callout to remain compact and stay inside the viewport, so that it does not create horizontal overflow.
6. As a maintainer, I want the callout text to use product-language target labels, so that visible copy stays independent of runtime internals.
7. As a maintainer, I want tests for no-target and recovery states, so that stale callouts do not remain visible when anchoring is unsafe.

## Implementation Decisions

- Reuse the existing target selection and product presentation helpers so the callout follows the same target label as the highlight and panel.
- Render the callout inside the injected shell's shadow root next to the existing highlight element, keeping styles isolated and read-only.
- Compute a viewport-clamped callout position from the target bounding box and use fixed positioning, matching the highlight coordinate model.
- Omit the callout when there is no usable highlighted target, when route mismatch hides the highlight, or when recovery suppresses normal progress.
- Add a lightweight React workbench explanation in the host preview so the local demo mirrors the injected-shell concept without pretending to be a real host reader.

## Testing Decisions

- Unit tests should cover callout style generation and no-callout behavior when the target has no bounding box.
- Injected shell tests should verify callout copy, accessible label, refresh on scroll/resize, disappearance on missing target, and product-only visible copy.
- Component tests should verify the React workbench host preview explains the highlighted target without changing the panel flow.
- Browser smoke should verify the injected callout appears with the target highlight and stays within desktop/mobile viewport bounds.

## Out of Scope

- No automatic clicking, form filling, or host-surface mutation.
- No new permissions, storage, telemetry, backend service, or public release work.
- No multi-step tutorial overlay.
- No screenshot capture, image recognition, or visual AI.
- No new provider support or route taxonomy changes.

## Further Notes

This slice improves page anchoring comprehension while preserving the product shape: the side panel remains compact, the host surface remains primary, and Michi's in-page layer stays limited to highlight, callout, and recovery cues.
