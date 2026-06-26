# Extension Injected Guide Semantics Decision

## Decision

Reuse the existing Cloudflare Workers site skill pack copy inside the injected extension shell instead of creating a separate content-script guide copy source.

## Context

The injected shell already reads `HostPageContext` from the current Cloudflare page. It can identify route IDs such as `cloudflare.workers.overview` and targets such as `create-worker-button`, but until this decision it only displayed route, target, and evidence. That proves page anchoring but does not fully express Michi's guide-agent behavior.

## Rationale

- The site skill pack is already the source of truth for Workers guide step title, action, purpose, target ID, expected route ID, and completion check.
- Reusing the same copy keeps the local web demo and extension shell aligned.
- The content script remains read-only because the guide step display does not create account writes or host-page mutations.
- No new extension permission is required.

## Consequences

- The vanilla injected shell imports a small domain fixture from `src/domain/siteSkillPack.ts`.
- The shell can render step semantics for known Workers routes without introducing a persistent guide session.
- If future milestones require full session state, the next decision should evaluate packaging the React guide panel for extension use.

## Rollback

Remove the guide-step rendering helper and panel section from `src/extension/injectedShell.ts`. The page reader, recovery guidance, target highlight, and local web demo remain intact.
