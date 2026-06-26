# Workers Guide Flow Shared State

## Summary

Michi currently has two guide-state surfaces: the React workbench uses `GuideCore`, while the injected extension shell keeps a smaller local guide flow. The injected shell has grown enough that route-to-step mapping, target selection, previous/next, critical confirmation, and completion gating should live in a shared domain helper instead of being hard-coded inside the shell.

## Goals

- Extract Workers guide flow decisions into a shared domain module.
- Keep injected shell behavior visually unchanged.
- Keep route-to-step mapping derived from `workersGuideSteps`.
- Keep critical write actions behind explicit confirmation.
- Keep Worker URL evidence as the completion gate.
- Preserve local React workbench behavior.

## Non-goals

- No React extension panel packaging.
- No removal of `GuideCore`.
- No new dependencies.
- No manifest, permission, storage, network, or Cloudflare automation changes.
- No new guide paths beyond the existing Workers path.

## UX Behavior

The user should see no UI change. The injected shell still starts from intent, routes backend/API to Workers, lets users navigate steps locally, requires confirmation for create/deploy steps, gates completion on Worker URL evidence, and shows the same target highlights and recovery guidance.

## Acceptance Criteria

- A shared domain helper owns Workers route-to-step lookup.
- A shared domain helper owns preferred target lookup.
- A shared domain helper owns previous, next, confirmation, and completion-gate transitions for the injected shell.
- Injected shell uses those helpers instead of local hard-coded transition logic.
- Unit tests cover route mapping, critical confirmation, final-step completion gating, and preferred target lookup.
- Existing injected shell unit tests and unpacked extension smoke still pass.

## Test Requirements

- `npm test -- tests/workersGuideFlow.test.ts tests/injectedShell.test.ts`
- `npm run build:extension && npx playwright test tests/e2e/extension-runtime.spec.ts --project=chromium`
- `npm test`
- `npm run build`
- `npm run test:e2e`
- `git diff --check`
