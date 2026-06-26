# Extension Injected Critical Confirmation Execution Plan

## Goal

Add local critical-action confirmation to Michi's injected extension shell so guide navigation cannot advance past write-like steps without explicit user confirmation.

## Scope

- Product spec: `docs/product-specs/extension-injected-critical-confirmation.md`
- Decision record: `docs/design-docs/extension-injected-critical-confirmation-decision.md`
- Injected shell UI/state: `src/extension/injectedShell.ts`
- Tests: `tests/injectedShell.test.ts`, `tests/e2e/extension-runtime.spec.ts`
- Evidence ledger: this file

## Non-goals

- No host-page mutation.
- No real Cloudflare writes.
- No production Chrome Web Store packaging.
- No new permissions or browser storage.
- No full completion flow in this slice.

## Tasks

- [x] Create stacked feature branch.
- [x] Add repo-local spec, execution plan, and decision record.
- [x] Add failing tests for injected critical-action confirmation.
- [x] Implement local confirmation phase in the injected shell.
- [x] Run unit, build, e2e, diff, and `/check` verification.
- [x] Record verification evidence.

## Evidence Ledger

| Check | Result | Evidence | Caveat |
| --- | --- | --- | --- |
| `npm test -- tests/injectedShell.test.ts` | Pass | 9 tests passed after the expected RED failure in the stale navigation assertion was updated for confirmation. | Focused injected-shell coverage only. |
| `npm test` | Pass | 7 test files passed, 37 tests passed. | Uses bundled local Node runtime path. |
| `npm run build` | Pass | `tsc -b && vite build` completed and emitted `dist/`. | Uses bundled local Node runtime path. |
| `npm run test:e2e` | Pass | Extension build completed; Playwright reported 3 passed, 1 skipped. Chromium unpacked-extension smoke covered the confirmation path. | Mobile extension-runtime smoke remains intentionally skipped by project config. |
| `git diff --check` | Pass | Exit 0 with no whitespace errors. | No output on success. |
| `/check` review | Pass | `bash /Users/bytedance/.agents/skills/check/scripts/run-tests.sh` passed with 7 test files and 37 tests. Base diff review found no hard stops. | Specialist review not activated: no auth, storage, dependency, public API, or new module-boundary change. |
| Product/interaction subagent review | Pass | Explorer subagent reported no P0/P1/P2 findings. It verified the confirmation gate, unit coverage, Chromium unpacked-extension smoke, Previous, Escape collapse, target highlight, and recovery behavior. | Read-only review; no file edits. |
| Security/permission subagent review | Pass | Explorer subagent reported no P0/P1/P2 findings. It verified no manifest permission expansion, no storage API, no host-page write path, no automatic Cloudflare action, and no dangerous API use in this slice. | Read-only review; no file edits. |
