# Sitegeist-Style Side Panel Shell Execution Plan

## Goal

Reshape Michi's current React demo and injected shell toward a Sitegeist-like browser agent form, with ampcode-inspired visual direction, product-only UI language, and without expanding runtime scope.

## Steps

- [x] Document the product spec and design decision.
- [x] Add component and e2e expectations for `Michi side panel`, compact rail controls, host-area dominance, and no overflow.
- [x] Refactor the React app shell:
  - browser canvas with warm grid surface,
  - current-page preview remains primary,
  - compact right-side Michi side panel,
  - mobile bottom drawer behavior.
- [x] Refactor panel content:
  - agent header with route/phase/progress,
  - intent composer,
  - guide step/evidence modules,
  - compact action bar.
- [x] Update injected shell copy and scoped styles to match the side-panel agent direction.
- [x] Hide provider-specific product names from the visible Michi UI while preserving internal fixture coverage.
- [x] Run unit tests, build, e2e, and visual/browser checks.
- [x] Move this execution plan to `completed/` once verified.

## Verification

- `npm test`
- `npm run build`
- `npm run test:e2e`
- `git diff --check`
- Browser screenshots for desktop and mobile
- `bash /Users/bytedance/.agents/skills/check/scripts/run-tests.sh`

## Non-Goals

- Chrome Web Store submission.
- Chrome Side Panel API migration.
- Broad Sitegeist-style permissions.
- Provider-branded product UI.
- LLM runtime integration.
- Live provider writes.
