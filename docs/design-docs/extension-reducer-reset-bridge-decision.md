# Extension Reducer Reset Bridge Decision

## Decision

Add Reset as a compact injected-shell projection through `guideSessionReducer`, and keep `HostPageContext` clearing in the shell event handler.

## Context

The React workbench already has reset behavior. The injected shell now uses reducer projections for the main guide transitions, but it still has no user-visible way to restart after a completed, recovered, or static-site path. The execution status also calls out a pending decision between a full `GuideSession` store and continued compact projections.

## Rationale

- Reset is user-visible and low risk, so it is a good next proof before a full shell state rewrite.
- Keeping Reset inside the expanded panel avoids adding more persistent rail controls.
- The reducer should own guide-session reset semantics, while the shell should own shell-only page evidence and highlight cleanup.
- A compact projection keeps this slice reviewable and avoids mixing reset with storage, rendering, or extension-packaging changes.

## Consequences

- The injected shell remains a compact Shadow DOM surface, not a full React or full `GuideSession` renderer.
- Reset clears local page evidence because that evidence is outside reducer-owned `GuideSession` state.
- Future work can still promote the shell to full `GuideSession` storage if compact projections become hard to reason about.

## Rollback

Remove the Reset button, reset bridge helper, tests, and this spec/decision record. No user data, browser permission, extension manifest, storage, or host page state requires rollback.
