# Workers Guide Flow Shared State Decision

## Decision

Extract the injected shell's Workers guide flow decisions into a shared domain module while leaving rendering in `src/extension/injectedShell.ts`.

## Context

The React workbench and injected shell started at different fidelity levels. The injected shell now supports local intent, route-to-step anchoring, previous/next navigation, critical confirmation, completion, recovery, target highlighting, and runtime-error hardening. Keeping flow decisions embedded in the shell makes future guide changes easy to update in one surface but forget in the other.

## Rationale

- A pure domain helper can be unit-tested without Shadow DOM or browser extension setup.
- Deriving route and target decisions from `workersGuideSteps` reduces duplicate route and target maps.
- Keeping the shell renderer vanilla avoids a large React-extension packaging change in this slice.
- The helper creates a safer stepping stone toward a later decision on shared reducers or a React extension panel.

## Consequences

- The injected shell imports a domain module for guide decisions.
- The shell still owns HTML rendering and event wiring.
- React `GuideCore` remains the workbench session engine for now.
- Future Workers guide-step edits should update `siteSkillPack` and shared flow tests, not shell-local route tables.

## Rollback

Inline the helper calls back into `src/extension/injectedShell.ts` and remove `src/domain/workersGuideFlow.ts` plus its tests. No data or permission rollback is required.
