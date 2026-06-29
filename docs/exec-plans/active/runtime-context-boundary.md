# Runtime Context Boundary Execution Plan

## Summary

Extract the next frontend architecture slice by defining Michi's provider-neutral runtime context boundary. The goal is to keep the product shell provider-neutral while preserving current local React and unpacked extension behavior.

This plan is active and should be split into small branches after the PRD issue breakdown is approved.

## Building

- Provider-neutral adapter contract for reading host page context.
- Current provider reader moved behind the adapter boundary.
- Product-neutral unsupported and runtime-failure copy paths.
- Tests that separate adapter behavior, product presentation, and browser shell proof.
- Documentation that records permission and publishing boundaries before broader host support.

## Not Building

- No new provider integration.
- No broader extension permissions.
- No store publishing.
- No backend, database, or LLM runtime.
- No live account writes.

## Execution Slices

- [x] Slice 1: Define provider-neutral page context adapter contract.
- [ ] Slice 2: Move the current provider reader behind the adapter boundary.
- [ ] Slice 3: Normalize unsupported and failure context through product language.
- [ ] Slice 4: Separate demo fixtures from runtime adapter tests.
- [ ] Slice 5: Add product-only runtime copy regression coverage.
- [ ] Slice 6: Confirm permission and publishing boundary.

## Evidence Ledger

| Check | Result | Notes |
| --- | --- | --- |
| `npm test -- tests/pageContextAdapter.test.ts` | Passed | RED first failed because `src/domain/pageContextAdapter.ts` did not exist; GREEN passed after adding the adapter contract and wrapper. |
| `npm test` | Passed | 16 files / 143 tests passed. |
| `npm run build` | Passed | TypeScript and Vite production build passed. |
| `npm run test:e2e` | Passed | 5 passed, 1 skipped after restarting a stale Vite dev server that was missing the current alias config. |
| Browser desktop/mobile proof | Passed | Covered by Playwright `michi-flow` desktop/mobile paths; no visible behavior changed in this slice. |
| `git diff --check` | Passed | No whitespace errors. |
| `bash /Users/bytedance/.agents/skills/check/scripts/run-tests.sh` | Passed | Runs `npm test`; 16 files / 143 tests passed. |

## Review Notes

- Slice 1 intentionally adds only the provider-neutral adapter contract and provider wrapper.
- Existing runtime callers are not migrated in this slice; moving the current provider reader behind the adapter boundary is Slice 2.
- Initial e2e run failed because Playwright reused a stale dev server on port 5173 that predated the current `@` alias config. Restarting the server and rerunning `npm run test:e2e` passed.
- GitHub issue publication is intentionally held until the user confirms issue granularity and the `ready-for-agent` label strategy.
