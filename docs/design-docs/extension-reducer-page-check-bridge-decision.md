# Extension Reducer Page Check Bridge Decision

## Decision

Bridge injected-shell page-check transitions through `guideSessionReducer` while leaving route anchoring and Worker URL evidence checks in `workersGuideFlow`.

## Context

The injected shell stores compact render state instead of a full `GuideSession`. The reducer already knows how to apply host page context, detect page drift, preserve pending confirmation, and recover from blocking states. The shell still needs `workersGuideFlow` for the current page reader's route-to-step mapping and completion evidence gate.

## Rationale

- Page-check transitions are the last major injected-shell state transitions still outside the reducer bridge.
- Keeping anchoring in `workersGuideFlow` avoids mixing DOM route detection with reducer state logic.
- Projecting reducer output back into compact shell state keeps the current Shadow DOM shell stable.
- This slice gives recovery behavior a shared reducer path without broad UI or runtime changes.

## Consequences

- Shell phase can represent reducer `recovery` for page-check output.
- `checkedContextWorkersGuideState` can be removed after shell callers move to the reducer bridge.
- Completion remains gated by `canCompleteWorkersGuide` until page context evidence is fully modeled in the reducer bridge.

## Rollback

Restore the `Check page` handler to `checkedContextWorkersGuideState` and re-add that helper if removed. No data, permissions, account state, or generated runtime artifacts require rollback.
