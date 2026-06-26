# Shared Guide Session Reducer Decision

## Decision

Introduce `src/domain/guideSessionReducer.ts` as the single owner of React workbench `GuideSession` state transitions, and keep `src/domain/guideCore.ts` as the compatibility API used by the current UI and tests.

## Context

`GuideCore` currently combines transition helpers, page-state mapping, and exported public functions in one module. The injected shell has already started moving Workers-specific decisions into `workersGuideFlow`. The next architectural step is to make React workbench session transitions explicit before deciding whether the extension panel should share a fuller session engine.

## Rationale

- A reducer-style action API is easier to test than multiple ad hoc exported functions.
- Compatibility wrappers avoid a wide React UI edit in this slice.
- Moving page-state mapping with the reducer keeps `apply-host-page-context` a complete, pure state transition.
- The reducer is a stepping stone toward sharing session transitions with the extension shell without packaging React into the extension yet.

## Consequences

- `GuideCore` remains the public domain facade for the React workbench.
- `guideSessionReducer` owns both session transitions and the page-state mapping needed by host-page context actions.
- New behavior should prefer reducer action tests before wrapper tests.
- Future extension work can decide whether to call the reducer directly or keep using the lighter Workers shell helpers.
- The visible browser UI should not change in this slice.

## Rollback

Inline reducer action handling back into `guideCore.ts`, remove `guideSessionReducer.ts`, and delete reducer-specific tests. No data, permissions, or runtime artifacts require rollback.
