# Product-Only UI Boundary Execution Plan

## Summary

Harden Michi's product-only UI boundary. The shell should present Michi product concepts while provider-specific adapters, route IDs, fixtures, and selector logic remain internal implementation details.

## Building

- Product-only UI PRD and issue breakdown.
- Decision doc for the provider-internal, product-visible boundary.
- Focused regression tests for visible React/injected shell copy and current-facing docs.
- Minimal copy/status updates required by the new boundary.
- Browser and test evidence recorded before commit.

## Not Building

- No provider adapter rewrite.
- No new provider support.
- No broader permissions.
- No public extension publishing.
- No live account automation.
- No visual redesign beyond copy and boundary hardening.

## Approach

Use the existing `productPresentation` boundary and existing rendered-copy test helpers. Add only the missing guard rails: current status/doc wording and representative visible UI states that can regress into provider-branded copy.

## Key Decisions

- Keep provider terms in adapter, fixture, and historical-doc layers.
- Reject provider terms from visible shell text and common accessibility attributes.
- Treat current status and active execution plans as user-facing product planning surfaces.
- Keep GitHub issue publication held until the label strategy is confirmed.

## Fragile Assumption

This plan assumes the visible UI already passes most product-copy checks and only needs boundary hardening. If focused tests reveal provider terms in core user flows, the slice should fix copy at the presentation boundary rather than renaming adapter internals.

## Acceptance Criteria

- React visible shell copy remains Michi product language through guide, recovery, confirmation, and completion.
- Injected shell visible copy remains Michi product language through guide, recovery, confirmation, and completion.
- Current execution status does not frame Michi as provider-specific UI.
- Provider-specific adapter, fixture, route, and historical milestone docs remain allowed.
- Focused tests, full tests, build, Playwright smoke, branch check, and diff check pass.
- Browser proof covers desktop and mobile product-copy visibility.

## Execution Slices

- [x] Slice 1: Record PRD, issue breakdown, decision doc, and active execution plan.
- [x] Slice 2: Add failing product-only copy and status/documentation guards.
- [x] Slice 3: Apply minimal copy/status changes to satisfy the boundary.
- [ ] Slice 4: Run browser proof, independent review, final verification, commit, push, and PR.

## Evidence Ledger

| Check | Result | Notes |
| --- | --- | --- |
| `npm test -- tests/productUiBoundary.test.ts` | Failed, then passed | RED failed because `docs/exec-plans/status.md` still framed current milestones with provider names; GREEN passed after rewriting current status into Michi product language while leaving historical file paths in code spans. |
| `npm test -- tests/App.test.tsx` | Failed, then passed | RED failed on `Page context synced` and `Context status`; GREEN passed after React visible page-state copy changed to `Page check synced` and `Check status`. |
| `npm test -- tests/productPresentation.test.ts` | Failed, then passed | RED failed because provider evidence still rendered as `Page context synced`; GREEN passed after `productPageStateCopy` rewrote provider sync evidence to `Page check synced`. |
| Independent subagent review | Found issues, then fixed | Review found stale status guard wording, reachable extension runtime failure `page context` copy, injected shell guard gaps, and current status implementation-framing wording. Fixed by broadening guards, updating runtime failure copy, and rewriting current status language. |
| `npm test -- tests/extensionPageContextProvider.test.ts tests/guideSessionReducer.test.ts` | Failed, then passed | RED failed on unsupported runtime `page context` copy; GREEN passed after unsupported runtime contexts and page-drift fallback copy changed to product-visible page-check language. |
| `npm test -- tests/productPresentation.test.ts tests/productUiBoundary.test.ts tests/App.test.tsx tests/injectedShell.test.ts` | Passed | 4 files / 53 tests passed for sanitizer, status guard, React shell, and injected shell product-copy coverage. |
| `npm test` | Passed | 21 files / 162 tests passed. |
| `npm run build` | Passed | TypeScript and Vite production build passed. |
| `git diff --check` | Passed | No whitespace errors. |
| `npm run test:e2e` | Failed, then passed | First full run failed on startup/timeouts after the product-copy assertions were fixed; `npx playwright test tests/e2e/michi-flow.spec.ts --workers=1` passed all 4 desktop/mobile flow tests, then the full `npm run test:e2e` rerun passed with 5 passed and 1 skipped. |
| `npm run test:e2e` | Passed | Extension build passed; Playwright reported 5 passed and 1 skipped after review fixes. |
| `bash /Users/bytedance/.agents/skills/check/scripts/run-tests.sh` | Passed | Runs `npm test`; 21 files / 162 tests passed. |

## Review Notes

- GitHub issue publication remains held because the repo label strategy is not confirmed.
- This slice is intentionally stacked on the runtime-context boundary work and does not widen the extension runtime.
- The first full E2E failure after the sanitizer fix did not reproduce. The serial flow suite and subsequent full E2E run both passed, so the recorded caveat is a transient Playwright/dev-server startup issue rather than a product-copy regression.
- `npm run check:branch -- --strict-clean` was intentionally deferred until after commit because strict-clean fails on a dirty working tree by design.
