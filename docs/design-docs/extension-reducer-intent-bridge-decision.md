# Extension Reducer Intent Bridge Decision

## Decision

Bridge the injected shell's intent start and service-kind choice actions through `guideSessionReducer`, then project the reducer result back into the shell's compact render state.

## Context

The React workbench now uses `guideSessionReducer` behind `GuideCore`. The injected shell still uses a smaller local state model plus `workersGuideFlow`. A full state migration would touch navigation, page anchoring, confirmation, completion, unsupported handling, and rendering all at once. The safer next move is to connect the first low-risk shared transitions.

## Rationale

- Start and service-kind actions do not depend on host page context, so they are the least risky bridge points.
- Keeping a projection layer avoids forcing the injected shell to render full `GuideSession` immediately.
- Leaving page anchoring and critical confirmation on `workersGuideFlow` keeps the current extension behavior stable.
- This slice gives future work a tested seam for migrating more actions.

## Consequences

- The injected shell imports a small bridge helper that depends on `guideSessionReducer`.
- Shell rendering remains vanilla DOM and Shadow DOM.
- Future migration can bridge next/confirm/check actions one at a time.

## Rollback

Remove the bridge helper and return the three event handlers to direct shell-state assignments. No data, permissions, or runtime artifacts require rollback.
