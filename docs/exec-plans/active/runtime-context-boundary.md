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

- [ ] Slice 1: Define provider-neutral page context adapter contract.
- [ ] Slice 2: Move the current provider reader behind the adapter boundary.
- [ ] Slice 3: Normalize unsupported and failure context through product language.
- [ ] Slice 4: Separate demo fixtures from runtime adapter tests.
- [ ] Slice 5: Add product-only runtime copy regression coverage.
- [ ] Slice 6: Confirm permission and publishing boundary.

## Evidence Ledger

| Check | Result | Notes |
| --- | --- | --- |
| `npm test` | Not run yet | Required for implementation slices. |
| `npm run build` | Not run yet | Required for implementation slices. |
| `npm run test:e2e` | Not run yet | Required for implementation slices. |
| Browser desktop/mobile proof | Not run yet | Required once visible/runtime behavior changes. |
| `git diff --check` | Not run yet | Required before commit. |
| `bash /Users/bytedance/.agents/skills/check/scripts/run-tests.sh` | Not run yet | Required before commit. |

## Review Notes

- This branch currently contains PRD and issue-breakdown work only.
- GitHub issue publication is intentionally held until the user confirms issue granularity and the `ready-for-agent` label strategy.
