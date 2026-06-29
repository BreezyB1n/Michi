# Runtime Context Permission And Publishing Boundary Decision

## Current Decision

Michi's current extension build remains a local validation runtime for page anchoring and injected-shell behavior.

- No store publishing in this milestone.
- No broader host permissions in this milestone.
- No all-site access, background polling, persistence, network writes, scripting permission, or Chrome Side Panel migration in this milestone.
- The manifest stays narrow: Manifest V3, `activeTab`, and the existing single supported host match.

## Why

The runtime context boundary milestone is about separating Michi product behavior from provider-specific page readers. Publishing or broadening permissions would change the trust model, review surface, and product scope before the adapter boundary is proven.

The current extension artifact is useful for local browser proof because it exercises content-script messaging, page reading, target highlighting, recovery, confirmation, and completion evidence. It is not yet a distribution artifact.

## Required Evidence Before Expansion

Any future branch that broadens permissions or prepares store publication must first provide:

- a product spec explaining the supported user workflow and why the new host or permission is required;
- a decision doc comparing the narrower alternative and explaining why it is insufficient;
- updated permission tests proving the manifest grants only the required scope;
- browser proof on reproducible fixture pages and a clearly separated manual proof plan for live supported pages;
- visible copy and recovery tests that keep provider internals out of the Michi product surface;
- a privacy and safety note covering data read from host pages, persistence, network behavior, and account-changing actions;
- explicit user approval before creating store packaging, listing metadata, signing keys, upload scripts, or release automation.

## Issue Publishing Boundary

The runtime context issue breakdown stays as a repo-local draft until the issue label strategy is confirmed. AFK-ready GitHub issues should not be published with a missing or ambiguous readiness label.

## Rollback

If this boundary is wrong, revert this decision and the corresponding publishing-boundary guard test. No runtime state, credentials, permissions, package scripts, or distribution artifacts are created by this slice.
