# Highlight Explanation Execution Plan

## Summary

Add a compact target callout to Michi's in-page highlight behavior. The callout should explain the highlighted target without expanding the side panel, blocking host-surface interaction, or exposing runtime internals.

## Current Boundary

- The host surface remains primary.
- Michi remains collapsed by default.
- The side panel footprint does not grow for this slice.
- Runtime readers and route IDs remain internal.
- No new permissions, storage, backend service, analytics, public listing work, autonomous navigation, or account writes.

## Design Thesis

- Visual thesis: target label at the point of attention.
- Content thesis: target name plus one short reason.
- Safety thesis: callout is read-only, non-blocking, and disappears when anchoring is unsafe.

## Implementation Slices

### Slice 1: Spec And Planning

- [x] Add Highlight Explanation PRD.
- [x] Add issue breakdown.
- [x] Add design decision.
- [x] Point execution status at this active plan.

### Slice 2: Shared Target Callout Presenter

- [x] Add product-language callout copy and style helpers.
- [x] Add unit tests for target, missing bounding box, and viewport-clamped positioning.
- [x] Keep runtime identifiers out of visible copy.

### Slice 3: Injected Shell Callout

- [x] Render the callout with the target highlight.
- [x] Keep callout pointer events disabled.
- [x] Remove callout during recovery, route mismatch, missing target, and minimize.
- [x] Add shadow DOM tests for callout copy and refresh behavior.

### Slice 4: React Workbench Mirror

- [x] Add a compact host-preview explanation for the highlighted target.
- [x] Hide stale explanation during recovery and completion.
- [x] Add component tests for normal and recovery behavior.

### Slice 5: Browser Proof And Review

- [x] Run focused tests, full tests, build, and browser proof.
- [x] Verify desktop/mobile no-horizontal-overflow behavior.
- [x] Verify unpacked runtime callout behavior.
- [x] Run standard check wrapper and independent review before commit.
- [x] Run branch freshness gate after commit.

## Acceptance Criteria

- A checked target shows a highlighted outline and compact callout together.
- The callout names the target and says Michi is checking it for the active guide step.
- The injected callout stays within viewport bounds in the reproducible desktop runtime smoke, and the React mirror stays within the host preview on desktop and mobile.
- Recovery and missing-target states remove normal highlight explanation.
- React workbench and injected shell use aligned product-language target explanation.
- No manifest, permission, package, storage, backend, analytics, or account-write changes are introduced.

## Test Matrix

| Layer | Coverage |
| --- | --- |
| Unit | Target callout copy and clamped position helper. |
| Component | React host-preview explanation and recovery suppression. |
| Injected shell | Shadow DOM callout rendering, scroll/resize refresh, and stale-callout removal. |
| Browser | Desktop/mobile React target callout visibility, injected desktop runtime callout bounds, and no overflow. |
| Merge gate | `git diff --check`, `npm test`, `npm run build`, `npm run test:e2e`, check wrapper, branch freshness. |

## Verification Ledger

| Command | Status | Notes |
| --- | --- | --- |
| `npm test -- tests/targetCallout.test.ts` | Passed | Shared target callout presenter tests: 3 passed after RED missing-module failure and expected-position correction. |
| `npm test -- tests/targetCallout.test.ts tests/App.test.tsx tests/injectedShell.test.ts tests/productUiBoundary.test.ts` | Passed | Focused UI/product-copy coverage: 4 files / 64 tests passed. |
| `npm run build` | Passed | TypeScript and production Vite build passed. |
| `npm run test:e2e` | Passed | Browser proof passed after review fixes: React desktop/mobile callout visible and horizontally contained, injected desktop runtime callout fixed/read-only and viewport-contained, 5 passed and 1 mobile extension-runtime smoke skipped by configuration. |
| `git diff --check` | Passed | No whitespace errors. |
| `npm test` | Passed | Full unit/component suite: 26 files / 204 tests passed. |
| `bash /Users/bytedance/.agents/skills/check/scripts/run-tests.sh` | Passed | Standard check wrapper passed with 26 files / 204 tests. |
| Independent subagent review | Addressed | Review found overclaimed mobile injected-runtime proof, missing bottom/resize/stale-callout assertions, and content-box overflow risk. Fixed with explicit callout guard, border-box styling, bottom/fixed/pointer checks, resize/missing-target coverage, and narrower ledger wording. |

## Review Notes

- The unpacked extension runtime smoke remains desktop Chromium only by project configuration. Mobile coverage for this slice is through the React workbench flow plus no-horizontal-overflow checks.
- The injected fixed callout uses `box-sizing: border-box` so the presenter width and browser bounding box share the same viewport clamp contract.
- Recovery, missing-target, and route-mismatch paths suppress normal target explanation rather than showing a stale callout.
| `npm run check:branch -- --strict-clean` | Passed | Branch `codex/michi-highlight-explanation` is ahead 1, behind 0, clean, and ready. |

## Rollback Plan

Revert the highlight explanation branch. The slice only changes local presentation, docs, and tests, so rollback does not require data migration, permission cleanup, or account-state changes.
