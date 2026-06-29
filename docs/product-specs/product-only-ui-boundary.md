# Product-Only UI Boundary Product Spec

## Summary

Michi's visible UI should describe Michi's own product model: intent, guide path, workspace context, page target, evidence, recovery, confirmation, and follow-up route. Provider examples can exist in adapters, fixtures, tests, and internal route ids, but provider branding must not leak into the React demo or injected shell.

This keeps Michi from reading as a Cloudflare-specific assistant while the current implementation still uses a Cloudflare-like fixture to prove page anchoring.

## Building

- Product-language copy for visible page-context signals.
- Regression tests that reject provider-branded terms in the React demo.
- Regression tests that reject provider-branded terms inside the injected Michi side panel.
- Playwright checks that the browser-visible product shell stays provider-neutral.
- Documentation that treats provider-specific readers as implementation details, not product identity.

## Not Building

- No new provider integration.
- No rename of internal route ids or existing fixture modules in this slice.
- No broad rewrite of completed historical specs.
- No permission, manifest, runtime messaging, or automation change.
- No removal of the Cloudflare-like local fixture used by extension smoke tests.

## Product Rule

Visible Michi UI may use these product concepts:

- workspace
- build area
- service runtime
- site publishing
- page route
- page target
- evidence
- recovery
- custom domain

Visible Michi UI must not use provider-branded concepts such as:

- Cloudflare
- Workers
- Pages
- DNS

Provider-branded names may remain in:

- mock URLs and host fixture markup;
- adapter and reader implementation names;
- route ids and target ids;
- test fixture assertions about raw provider context;
- completed historical execution plans.

## Acceptance Criteria

- The React demo can complete service and static-site guide paths without showing provider-branded copy.
- The injected shell can start, check, recover, confirm, and complete without showing provider-branded copy inside the Michi panel.
- Provider raw signals are sanitized before display.
- Fixture host pages may still contain provider-branded text because they represent the page being read, not Michi's product UI.
- Future UI changes must keep provider names behind product-presentation helpers.

## Test Requirements

- Unit test `sanitizeProviderText` maps provider-branded signals into product language.
- Component tests assert the React visible body does not contain provider-branded terms after service and site paths render.
- Injected-shell tests assert `Michi side panel` text does not contain provider-branded terms after guide start and page check.
- Playwright app smoke asserts both the side panel and React demo body remain provider-neutral.
- Playwright extension smoke asserts the injected side panel remains provider-neutral while the host fixture can still contain provider text.
