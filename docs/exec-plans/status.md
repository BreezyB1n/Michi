# Michi Execution Status

## Current State

Michi has a verified local React workbench and unpacked extension runtime for a compact page guide shell. The current extension surface is injected, collapsed by default, and supports deterministic service/site guide behavior, page checks, target highlights, recovery states, critical-action confirmation, completion follow-up, permission guards, runtime-error handling, route-state guards, scroll/resize highlight refresh, activity history, compact command handoff, and predictable keyboard focus lifecycle. Runtime readers remain internal adapters; visible UI stays in Michi product language.

## Completed Milestones

| Milestone | Execution Plan | Proof Summary |
| --- | --- | --- |
| Web UI foundation | `completed/michi-web-ui-mvp.md` | Local React/Vite workbench, Guide Core, service happy path, recovery, confirmation, completion, desktop/mobile verification. |
| Guide semantics | `completed/extension-injected-guide-semantics.md` | Injected shell maps page routes to service guide steps. |
| Guide navigation | `completed/extension-injected-guide-navigation.md` | Injected shell supports local Previous/Next step navigation. |
| Session start | `completed/extension-injected-session-start.md` | Injected shell starts from intent and routes backend/API to service setup. |
| Critical confirmation | `completed/extension-injected-critical-confirmation.md` | Injected shell requires explicit confirmation for critical write-action steps. |
| Completion follow-up | `completed/extension-injected-completion-followup.md` | Service URL evidence gates completion and shows custom-domain follow-up. |
| Full path smoke | `completed/extension-injected-full-path-smoke.md` | Unpacked extension smoke covers overview, starter editor, deploy review, deploy result, and recovery paths. |
| Unsupported hardening | `completed/extension-injected-unsupported-hardening.md` | Unsupported product areas show recovery guidance without stale guide/completion state. |
| Permission guard | `completed/extension-permission-guard.md` | Static guard keeps manifest scope narrow and read-only. |
| Computed dynamic import guard | `completed/extension-computed-dynamic-import-guard.md` | Extension source graph rejects unscannable computed dynamic imports. |
| Runtime error surface | `completed/extension-runtime-error-surface.md` | Provider/runtime failures map to explicit recovery state and extension message error coverage. |
| Extension provider timeout | `completed/extension-provider-timeout.md` | Extension page-check requests now resolve to controlled recovery context when runtime messaging stalls instead of hanging `Check page`. |
| Highlight reposition | `completed/extension-highlight-reposition.md` | Target highlight stays aligned after window and nested-container scroll plus resize. |
| Service guide flow shared state | `completed/workers-guide-flow-shared.md` | Injected-shell service guide flow decisions now live in shared domain helpers with focused unit coverage. |
| Shared guide session reducer | `completed/shared-guide-session-reducer.md` | React workbench guide-session transitions now run through a pure reducer behind the existing `GuideCore` facade. |
| Extension reducer intent bridge | `completed/extension-reducer-intent-bridge.md` | Injected-shell intent start and service-kind choices now project through the shared guide-session reducer. |
| Extension reducer flow bridge | `completed/extension-reducer-flow-bridge.md` | Injected-shell previous, next, critical confirmation, and completion actions now project through the shared guide-session reducer. |
| Extension reducer page-check bridge | `completed/extension-reducer-page-check-bridge.md` | Injected-shell page checks now project through the shared guide-session reducer while preserving page anchoring and critical confirmation safety. |
| Extension reducer reset bridge | `completed/extension-reducer-reset-bridge.md` | Injected-shell Reset now projects through the shared guide-session reducer, clears shell-only page evidence, and keeps the rail compact. |
| Static-site guide path | `completed/cloudflare-pages-guide-path.md` | Static-site intent now routes to a deterministic site-publishing guide path across the React workbench and injected extension shell, including site page anchoring, confirmation, completion evidence, and custom-domain follow-up. |
| Extension route-state guard | `completed/extension-route-state-guard.md` | Injected-shell Check page now preserves the selected service/site guide path, sends cross-path checks to recovery, suppresses wrong-path highlights, and reads SPA-style URL changes dynamically. |
| Extension runtime fixture boundary | `completed/extension-runtime-fixture-boundary.md` | Product fixture generation now lives in test support, keeping the unpacked extension runtime smoke focused on browser and guide-shell behavior. |
| Branch freshness checklist | `completed/branch-freshness-checklist.md` | Local `check:branch` reports ahead/behind/superseded/main/dirty branch states and adds a strict-clean pre-PR gate. |
| Sitegeist-style side panel shell | `completed/sitegeist-style-side-panel-shell.md` | React workbench and injected shell now use a product-only Michi side-panel form with ampcode-inspired visual direction, provider-neutral visible copy, and desktop/mobile overflow proof. |
| Runtime context boundary | `completed/runtime-context-boundary.md` | Provider-specific page readers now sit behind an adapter boundary; unsupported/failure context is product-neutral; test fixtures stay in test support; visible runtime copy is product-only; permission and publishing boundaries are documented and guarded. |
| Product-only UI boundary | `completed/product-only-ui-boundary.md` | React workbench, injected shell, runtime failure states, current status docs, and browser smoke now reject provider-facing UI language. |
| Product surface activity history | `completed/product-surface.md` | React workbench and injected shell now show deterministic Michi-owned activity history for intent start, path choice, page checks, recovery, confirmation, completion, and reset. |
| Command handoff | `completed/command-handoff.md` | React workbench and injected shell now show deterministic next-command recommendations without bypassing confirmation or recovery safety. |
| Keyboard focus lifecycle | `completed/keyboard-focus-lifecycle.md` | React workbench and injected shell now focus the primary panel control on open, keep focus inside Michi after guide re-renders, return focus to the rail on collapse, and preserve state on Escape. |
| Unsupported page guidance | `completed/unsupported-page-guidance.md` | React workbench and injected shell now show productized recovery guidance for unsupported surfaces, route mismatch, missing targets, and runtime-read failures without exposing normal progress during recovery. |
| First-run readiness | `completed/first-run-readiness.md` | React workbench and injected shell now show a compact first-open checklist with unchecked-placeholder, recovery-warning, product-copy, and desktop/mobile overflow proof. |
| Highlight explanation | `completed/highlight-explanation.md` | React workbench and injected shell now explain highlighted targets with compact product-language callouts, stale-callout suppression, and browser proof. |

## Active Work

- None. Start the next slice from a fresh branch and a new active execution plan.

## Housekeeping

- `completed/exec-plan-ledger-cleanup.md`: moved finished execution plans out of `active/` and created this status overview.

## Recommended Next Direction

After highlight explanation, evaluate whether the next slice should make page-check timing and loading states clearer without expanding the panel footprint. Keep future work inside the compact side panel unless a new spec says otherwise.

## Verification Baseline

Use these commands as the default merge gate for future frontend slices:

- `npm run check:branch -- --strict-clean`
- `npm test`
- `npm run build`
- `npm run test:e2e`
- `git diff --check`
- `bash /Users/bytedance/.agents/skills/check/scripts/run-tests.sh`
