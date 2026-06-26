# Michi Execution Status

## Current State

Michi has a verified local React workbench and a Cloudflare-only unpacked extension runtime. The current extension surface is an injected, collapsed-by-default shell with deterministic Workers guide behavior, page context checks, target highlights, recovery states, critical-action confirmation, completion follow-up, permission guards, runtime-error handling, and scroll/resize highlight refresh.

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
| Highlight reposition | `completed/extension-highlight-reposition.md` | Target highlight stays aligned after window and nested-container scroll plus resize. |

## Active Work

No active execution plan is currently open.

## Housekeeping

- `completed/exec-plan-ledger-cleanup.md`: moved finished execution plans out of `active/` and created this status overview.

## Recommended Next Direction

The next product slice should consolidate duplicated guide-state logic between the React workbench and vanilla injected shell. The extension shell has grown from a simple page-context proof into a local guide surface, so the next decision should evaluate whether to extract shared guide-session reducers/helpers or package a React-based extension panel.

## Verification Baseline

Use these commands as the default merge gate for future frontend slices:

- `npm test`
- `npm run build`
- `npm run test:e2e`
- `git diff --check`
- `bash /Users/bytedance/.agents/skills/check/scripts/run-tests.sh`
