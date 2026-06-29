# Command Handoff Execution Plan

## Summary

Add a compact command handoff region to Michi's React workbench and injected extension shell. The handoff recommends the next safe guide action from the current session phase, explains why it matters, and invokes existing handlers without adding new runtime permissions or automation.

## Current Boundary

- The host page remains primary.
- The side panel remains compact and collapsed by default.
- Runtime readers stay internal.
- Visible copy stays in Michi product language.
- Critical confirmation and recovery cannot be bypassed.
- No new storage, analytics, backend service, account writes, permissions, or public listing work.

## Design Thesis

- Visual thesis: embedded operator panel with dense state, one clear recommendation, and minimal surface depth.
- Content plan: orient the user, recommend the next action, expose safe secondary actions, then preserve history below it.
- Interaction thesis: primary command has clear press feedback; unsafe phases use warning tone; completed state points to follow-up without auto-starting it.

## Implementation Slices

### Slice 1: Spec And Planning

- [x] Add Command Handoff PRD.
- [x] Add command handoff issue breakdown.
- [x] Add command handoff design decision.
- [x] Point execution status at this active plan.

### Slice 2: Command Handoff Model

- [x] Add typed command handoff domain model.
- [x] Add unit tests for intent, clarify, guide, confirm, recovery, complete, and reset-ready output.
- [x] Prove confirmation and recovery states do not expose unsafe normal progress.

### Slice 3: React Handoff UI

- [x] Render the compact handoff in the expanded side panel.
- [x] Wire command buttons to existing handlers.
- [x] Keep copy wrapped and product-only.
- [x] Add component tests for rendering and action invocation.

### Slice 4: Injected Shell Handoff UI

- [x] Render a compact handoff summary in the injected shell.
- [x] Wire shell command buttons to existing shell actions.
- [x] Keep shadow-root product-only copy coverage.

### Slice 5: Browser Proof And Review

- [x] Run focused tests, build, and browser proof.
- [x] Verify desktop and mobile no-horizontal-overflow behavior.
- [x] Verify extension runtime smoke with handoff visible.
- [x] Run full test suite and standard check wrapper.
- [x] Run independent review before commit.

## Acceptance Criteria

- Every guide phase has a deterministic recommended command.
- Confirmation phase recommends explicit confirmation, not normal advance.
- Recovery phase recommends recovery, not normal advance.
- Complete phase suggests follow-up without starting it automatically.
- React and injected shell render handoff copy in Michi product language.
- Existing guide, recovery, confirmation, completion, reset, and activity behavior remain intact.

## Test Matrix

| Layer | Coverage |
| --- | --- |
| Unit | Command model output for all phases and blocked-state safety. |
| Component | React handoff rendering, button wiring, product-copy guard, long-copy wrapping. |
| Injected shell | Shadow DOM handoff rendering, action wiring, product-copy guard. |
| Browser | Desktop and mobile guide path with handoff through recovery, confirmation, completion, and reset. |
| Merge gate | `git diff --check`, `npm test`, `npm run build`, `npm run test:e2e`, check wrapper, branch freshness. |

## Verification Ledger

| Command | Status | Notes |
| --- | --- | --- |
| `npm test -- tests/commandHandoff.test.ts` | Passed | 9 command model tests passed, including recovery without a blocking state. |
| `npm test -- tests/commandHandoff.test.ts tests/App.test.tsx tests/injectedShell.test.ts tests/productUiBoundary.test.ts` | Passed | Focused domain, React, injected shell, and current-facing product-copy guard: 62 tests passed. |
| `npm run build` | Passed | TypeScript and production Vite build passed. |
| `npm run test:e2e` | Passed | Browser proof covered React workbench and unpacked extension handoff; 5 passed and 1 mobile extension-runtime test skipped by configuration. Strict locator regressions were fixed by scoping recovery assertions. |
| `git diff --check` | Passed | No whitespace errors. |
| `npm test` | Passed | Full unit/component suite: 23 files and 182 tests passed. |
| `bash /Users/bytedance/.agents/skills/check/scripts/run-tests.sh` | Passed | Standard check wrapper passed with 182 tests. |
| Independent subagent review | Passed | Runtime/UI and spec/test reviews completed; P2/P3 findings were addressed with regression assertions and execution-ledger updates. |
| `npm run check:branch -- --strict-clean` | Passed | Branch is ahead 1, behind 0, dirty 0, and strict-clean ready. |

## Rollback Plan

Revert the command handoff branch. The slice only adds local UI and derived session state, so rollback does not require data migration, permission changes, account cleanup, or runtime contract changes.
