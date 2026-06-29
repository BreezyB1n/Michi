# Product-Only UI Boundary Execution Plan

## Summary

Lock Michi's visible UI to product language only. Provider-specific readers and fixtures may stay in place, but the React demo and injected shell should not expose provider-branded copy.

## Building

- Product-presentation copy update for provider-branded route signals.
- React component regression coverage for product-only visible copy.
- Injected-shell regression coverage for product-only side-panel copy.
- Playwright regression coverage for app and extension side-panel copy.
- Spec and decision docs for the boundary.

## Not Building

- No adapter migration.
- No fixture removal.
- No manifest, permission, service-worker, or content-script behavior change.
- No historical-doc rewrite.

## Checklist

- [x] Add product boundary spec and decision doc.
- [x] Add regression tests for provider-branded visible UI leakage.
- [x] Update product-presentation copy for raw provider signals.
- [x] Run focused tests.
- [x] Run full verification baseline.
- [x] Commit, push, and open a stacked draft PR.

## Evidence Ledger

| Check | Result | Notes |
| --- | --- | --- |
| `npm test -- tests/productPresentation.test.ts tests/App.test.tsx tests/injectedShell.test.ts` | Passed | 3 files / 47 tests passed with product-only visible-copy assertions for React and injected shell. |
| `npm test` | Passed | 16 files / 144 tests passed. |
| `npm run build` | Passed | TypeScript and Vite production build passed. |
| `npm run test:e2e` | Passed | Extension build passed; Playwright reported 5 passed, 1 skipped. |
| `git diff --check` | Passed | No whitespace errors. |
| `bash /Users/bytedance/.agents/skills/check/scripts/run-tests.sh` | Passed | Runs `npm test`; 16 files / 144 tests passed. |
| `npm run check:branch -- --strict-clean` | Passed | Branch `codex/michi-product-only-ui-boundary` is clean, ahead 4, behind 0, ready. |
| Draft PR | Opened | `https://github.com/BreezyB1n/Michi/pull/23`, stacked on `codex/michi-page-context-adapter-contract`. |
