# Sitegeist-Style Side Panel Shell Decision

## Context

The current Michi demo proves guide state, page anchoring, extension injection, recovery, critical confirmations, and deterministic guide paths. The product shape still reads too much like an always-open demo panel. The target form should be closer to Sitegeist: a browser agent that lives as a rail and side panel while reading the active page.

The visual reference is ampcode.com, which uses strong editorial typography and warm grid structure. Michi should borrow the confidence and contrast, but keep an operational dashboard layout.

## Decision

Use a side-panel-first shell as Michi's near-term product form.

Michi can keep provider-specific fixtures internally for verification, but the visible UI should already communicate the eventual browser-extension behavior:

- rail collapsed by default,
- side panel opens on demand,
- page context is shown as evidence,
- guide steps are compact and action oriented,
- confirmations and recovery are first-class states,
- active page stays visually primary.

Visible Michi UI should be product language only. Provider names belong in fixtures, tests, and future integrations, not in the app shell's core visual identity.

## Why Not A Full Sitegeist Clone

Sitegeist is a broad browser AI assistant with many tools and wide permissions. Michi is a guided page companion. Copying Sitegeist's full runtime model would add unnecessary permission, security, and product-scope risk before Michi proves its guided workflow.

## Why Not A Marketing-Style Amp Clone

Amp's website is a landing page. Michi's first viewport is a product tool. The useful style signals are grid, contrast, sharp controls, and terminal-like credibility. Large hero typography and promotional composition should not become Michi's app shell.

## Constraints

- Keep the current Tailwind + shadcn-style component foundation.
- Keep Phosphor icons unless a future component-library migration is approved.
- Keep extension permissions narrow.
- Keep deterministic local guide behavior.
- Keep the active page preview as the dominant visual area.

## Consequences

- The React demo becomes a better proxy for the eventual browser-extension experience.
- The injected shell and React demo share a clearer product language.
- Future work can decide whether to move from injected shell to Chrome Side Panel API without redesigning the guide experience again.
- Tests should verify shell form and overflow behavior, not only guide-state correctness.
