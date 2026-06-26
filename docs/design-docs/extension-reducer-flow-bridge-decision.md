# Extension Reducer Flow Bridge Decision

## Decision

Bridge injected-shell local Workers flow actions through `guideSessionReducer` one action at a time, then project reducer output back into the shell's compact render state.

## Context

The injected shell still uses plain Shadow DOM rendering and a small state object. `workersGuideFlow` owns step navigation, confirmation, and completion gating. The React workbench now uses a shared reducer, and the first extension bridge slice already routes intent start and service-kind choice through that reducer.

## Rationale

- Previous, next, confirmation, and completion are deterministic reducer actions, so they are good bridge candidates.
- Keeping the shell state compact avoids a broad rewrite of rendering and host-page anchoring.
- Completion must keep the existing shell-side Worker URL evidence gate until page context is fully represented in reducer state.
- This keeps each migration step reviewable and preserves the extension runtime contract.

## Consequences

- The extension bridge helper reconstructs a reducer session from shell state before projecting flow actions.
- `workersGuideFlow` can shed local navigation and confirmation helpers after shell callers move to the bridge.
- Page anchoring, unsupported contexts, target highlights, and runtime-error handling remain unchanged in this slice.

## Rollback

Restore injected shell handlers to `workersGuideFlow` local helpers and re-add any removed helper exports. No user data, account state, permissions, or build artifacts require rollback.
