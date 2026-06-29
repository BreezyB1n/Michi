# Sitegeist-Style Side Panel Shell Product Spec

## Summary

Michi should feel like a browser-native guide agent, not a web app that happens to sit beside a page. This milestone reshapes the current React demo and injected extension shell toward the product form proven by Sitegeist: a small collapsed rail, an expandable side-panel agent workspace, and page-context evidence that keeps the current page as the main surface.

The visual reference is ampcode.com: sparse grid rhythm, black ink surfaces, compact command controls, high-contrast evidence blocks, and enough product screenshot/terminal feel to make the agent trustworthy. The implementation should translate that style into an operational page companion, not copy a marketing landing page.

The UI itself must be Michi product language only. Provider-specific fixtures such as Cloudflare can remain inside tests, guide data, and internal demo state, but the visible Michi shell should not frame the product as Cloudflare UI.

## Building

- A side-panel-first React demo layout where the current-page preview remains wider than Michi.
- A renamed product surface: `Michi side panel` instead of generic plugin panel language.
- A compact agent console panel with:
  - current tab and route context without provider-specific branding,
  - guide phase/progress,
  - intent composer,
  - active guide step,
  - page anchor/evidence inspector,
  - critical confirmation and recovery states.
- A minimal rail that opens the guide, checks the page, and minimizes the side panel.
- Amp-inspired visual system:
  - warm paper background,
  - subtle vertical grid lines,
  - near-black primary panel/header/actions,
  - cyan/blue only for focused actionable accents,
  - crisp rectangular cards with small radii,
  - dense type hierarchy using existing Geist fonts.
- The injected shell should adopt the same product language and visual direction while staying vanilla Shadow DOM.

## Not Building

- No Sitegeist code copy or broad Sitegeist feature parity.
- No all-host permissions.
- No Chrome Side Panel API packaging in this milestone.
- No debugger/CDP tooling.
- No live provider automation.
- No LLM-backed runtime.
- No generic image/video rail tools.
- No provider-branded UI, including visible vendor, platform, or provider-feature framing in the Michi product shell.
- No marketing hero as the first screen.

## Product Principles

- The page stays primary. Michi should never visually dominate the browser viewport.
- Michi explains intent, next action, and evidence in one glance.
- Page checks are explicit until the runtime has a stronger observation model.
- Critical write actions still require explicit confirmation.
- Recovery should explain what changed, why progress is blocked, and how to return to the guide path.

## Functional Requirements

- The React demo starts with the side panel collapsed and the rail visible.
- Opening the rail shows an element with accessible label `Michi side panel`.
- The legacy `Michi plugin panel` label is removed from the React demo copy.
- The current-page preview remains wider than the expanded side panel on desktop.
- Mobile renders the side panel as a bottom drawer that does not exceed 72% viewport height.
- The rail contains only guide-relevant controls: guide, check, minimize.
- The side panel header shows the active page route and guide phase.
- Intent, clarification, guide, confirmation, recovery, and completion phases remain reachable.
- Page state shows location, highlighted target, context status, and evidence.
- Completion continues to show the next recommended route in product language.
- The injected shell keeps its existing deterministic guide behavior while matching the new shell copy and style.

## Visual Acceptance Criteria

- The first screen reads as a browser side-panel companion, not a landing page.
- The current-page preview has most of the horizontal space on desktop.
- The side panel uses compact, high-density rows rather than large stacked marketing cards.
- The rail and panel do not contain `Image` or `Video` controls.
- No text overlaps at desktop or mobile viewport sizes.
- No one-note purple/blue gradient theme.
- The completion evidence pulse remains visible but restrained.

## Test Requirements

### Unit and Component Tests

- App starts collapsed with the rail visible and side panel absent.
- Clicking `Guide` opens `Michi side panel` without resetting session state.
- Side panel header renders route, phase, and progress.
- Guide workspace renders capability, action, purpose, completion check, and page state.
- Confirmation requires explicit confirmation.
- Recovery explains the blocking change, reason, and recovery action.
- Rail has no `Image` or `Video` controls.

### Playwright Smoke

- Open app, expand Michi, start sample intent, choose backend/API.
- Verify the host area is wider than the side panel on desktop.
- Simulate page drift, recover, continue.
- Confirm critical actions and reach the custom-domain follow-up.
- Verify no horizontal overflow on desktop and mobile.

### Extension Smoke

- Build unpacked extension.
- Open the supported fixture page with extension loaded.
- Confirm rail and guide shell still appear.
- Confirm the injected panel copy says side panel/agent workspace, not media-tool language.
- Confirm page check, highlight, recovery, confirmation, and completion paths still pass.
- Confirm visible Michi shell copy avoids provider-specific product names.

## Rollback

The change is mainly presentation and shell copy. Roll back by reverting the React layout/style changes plus injected shell style changes. Domain reducers, Cloudflare page reader, provider runtime, and guide-path logic should remain intact.
