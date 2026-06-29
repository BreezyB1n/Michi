# Michi Execution Status

## Current State

Michi has a verified local React workbench and a Cloudflare-only unpacked extension runtime. The current extension surface is an injected, collapsed-by-default shell with deterministic Workers and Pages guide behavior, page context checks, target highlights, recovery states, critical-action confirmation, completion follow-up, permission guards, runtime-error handling, route-state guards, and scroll/resize highlight refresh.

## Completed Milestones

| Milestone | Execution Plan | Proof Summary |
| --- | --- | --- |
| Web UI MVP | `completed/michi-web-ui-mvp.md` | Local React/Vite workbench, Guide Core, Cloudflare Workers happy path, recovery, confirmation, completion, desktop/mobile verification. |
| Guide semantics | `completed/extension-injected-guide-semantics.md` | Injected shell maps page routes to Workers guide steps. |
| Guide navigation | `completed/extension-injected-guide-navigation.md` | Injected shell supports local Previous/Next step navigation. |
| Session start | `completed/extension-injected-session-start.md` | Injected shell starts from intent and routes backend/API to Workers. |
| Critical confirmation | `completed/extension-injected-critical-confirmation.md` | Injected shell requires explicit confirmation for critical write-action steps. |
| Completion follow-up | `completed/extension-injected-completion-followup.md` | Worker URL evidence gates completion and shows DNS follow-up. |
| Full path smoke | `completed/extension-injected-full-path-smoke.md` | Unpacked extension smoke covers overview, starter editor, deploy review, deploy result, and recovery paths. |
| Unsupported hardening | `completed/extension-injected-unsupported-hardening.md` | Unsupported Cloudflare areas show recovery guidance without stale guide/completion state. |
| Permission guard | `completed/extension-permission-guard.md` | Static guard keeps manifest and extension runtime Cloudflare-only/read-only. |
| Computed dynamic import guard | `completed/extension-computed-dynamic-import-guard.md` | Extension source graph rejects unscannable computed dynamic imports. |
| Runtime error surface | `completed/extension-runtime-error-surface.md` | Provider/runtime failures map to explicit recovery state and service-worker error coverage. |
| Extension provider timeout | `completed/extension-provider-timeout.md` | Extension page-context requests now resolve to controlled recovery context when runtime messaging stalls instead of hanging `Check page`. |
| Highlight reposition | `completed/extension-highlight-reposition.md` | Target highlight stays aligned after window and nested-container scroll plus resize. |
| Workers guide flow shared state | `completed/workers-guide-flow-shared.md` | Injected-shell Workers guide flow decisions now live in shared domain helpers with focused unit coverage. |
| Shared guide session reducer | `completed/shared-guide-session-reducer.md` | React workbench guide-session transitions now run through a pure reducer behind the existing `GuideCore` facade. |
| Extension reducer intent bridge | `completed/extension-reducer-intent-bridge.md` | Injected-shell intent start and service-kind choices now project through the shared guide-session reducer. |
| Extension reducer flow bridge | `completed/extension-reducer-flow-bridge.md` | Injected-shell previous, next, critical confirmation, and completion actions now project through the shared guide-session reducer. |
| Extension reducer page-check bridge | `completed/extension-reducer-page-check-bridge.md` | Injected-shell page checks now project through the shared guide-session reducer while preserving page anchoring and critical confirmation safety. |
| Extension reducer reset bridge | `completed/extension-reducer-reset-bridge.md` | Injected-shell Reset now projects through the shared guide-session reducer, clears shell-only page evidence, and keeps the rail compact. |
| Cloudflare Pages guide path | `completed/cloudflare-pages-guide-path.md` | Static-site intent now routes to a deterministic Pages guide path across the React workbench and injected extension shell, including Pages page anchoring, confirmation, completion evidence, and DNS follow-up. |
| Extension route-state guard | `completed/extension-route-state-guard.md` | Injected-shell Check page now preserves the selected Workers/Pages guide path, sends cross-path checks to recovery, suppresses wrong-path highlights, and reads SPA-style URL changes dynamically. |
| Extension runtime fixture boundary | `completed/extension-runtime-fixture-boundary.md` | Cloudflare dashboard fixture generation now lives in test support, keeping the unpacked extension runtime smoke focused on browser and guide-shell behavior. |
| Branch freshness checklist | `completed/branch-freshness-checklist.md` | Local `check:branch` reports ahead/behind/superseded/main/dirty branch states and adds a strict-clean pre-PR gate. |
| Sitegeist-style side panel shell | `completed/sitegeist-style-side-panel-shell.md` | React demo and injected shell now use a product-only Michi side-panel form with ampcode-inspired visual direction, provider-neutral visible copy, and desktop/mobile overflow proof. |

## Active Work

- `active/runtime-context-boundary.md`: PRD and issue breakdown for separating provider-specific page readers from Michi's product runtime context boundary.

## Housekeeping

- `completed/exec-plan-ledger-cleanup.md`: moved finished execution plans out of `active/` and created this status overview.

## Recommended Next Direction

The next product slice is the runtime context boundary: separate provider-specific page readers and demo fixtures from Michi's product runtime vocabulary before adding new providers or broader extension permissions.

## Verification Baseline

Use these commands as the default merge gate for future frontend slices:

- `npm run check:branch -- --strict-clean`
- `npm test`
- `npm run build`
- `npm run test:e2e`
- `git diff --check`
- `bash /Users/bytedance/.agents/skills/check/scripts/run-tests.sh`
