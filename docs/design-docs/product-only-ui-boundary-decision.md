# Product-Only UI Boundary Decision

## Context

Michi is moving toward a browser companion shape. The current runtime still uses a Cloudflare-like fixture and reader to prove page anchoring, but the product should not present itself as a Cloudflare UI. Provider language in the shell weakens Michi's positioning and makes later provider support harder to explain.

## Decision

Treat provider names as adapter-layer details. The visible Michi UI must use product-level language only.

The product layer can still say service runtime, site publishing, workspace, page route, page target, evidence, and custom domain. It should not say Cloudflare, Workers, Pages, or DNS in the React demo or injected Michi side panel.

## Consequences

- `productPresentation` remains the boundary for converting raw provider context into visible Michi copy.
- UI and browser tests now guard against provider-branded copy in Michi-owned surfaces.
- Existing Cloudflare-like fixtures remain useful because they prove Michi can read a real host page shape without making that provider the product identity.
- Future provider adapters can be added without rebranding the shell.

## Open Boundary

Internal route ids, fixture URLs, reader names, and completed historical docs can remain provider-specific until a broader runtime-context migration renames those implementation details.
