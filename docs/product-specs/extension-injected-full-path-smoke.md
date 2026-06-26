# Extension Injected Full Path Smoke

## Summary

Michi's injected extension shell should have browser smoke coverage for the full Cloudflare Workers guide path across page-anchored states. The prior slices proved session start, overview anchoring, critical confirmation, completion, and recovery. This slice closes the browser-proof gap by checking that the injected shell can re-anchor to starter editor and deployment review pages before reaching deployment result completion.

## Goals

- Exercise the injected shell against distinct Cloudflare fixture pages for Workers overview, starter editor, deployment review, deployment result, and missing-target recovery.
- Verify that `Check page` maps each supported fixture page to the matching Workers guide step.
- Verify that the deploy-review page shows `Step 4 / 5`, `Deploy the Worker`, the deploy target highlight, and the critical deploy confirmation.
- Keep the completion and DNS follow-up path evidence-backed by Worker URL detection.
- Preserve the Cloudflare-only, read-only extension runtime boundary.

## Non-goals

- No real Cloudflare account session, deployment, DNS change, account write, navigation automation, or browser-store packaging.
- No new extension permissions, storage APIs, remote network calls, backend service, or LLM runtime.
- No broad UI redesign or React content-script migration.
- No attempt to make the fixture a full Cloudflare dashboard clone.

## UX Behavior

In the Chromium unpacked-extension smoke, Michi should:

1. Load on a Cloudflare Workers overview fixture and anchor to `Create Worker`.
2. Load on a starter editor fixture and anchor to the starter handler.
3. Load on a deployment review fixture and anchor to the deploy button.
4. Require confirmation before locally advancing past `Deploy the Worker`.
5. Load on a deployment result fixture, detect the Worker URL, complete the guide, and recommend Cloudflare DNS.
6. Still explain recovery when the expected overview target is missing.

## Acceptance Criteria

- Browser smoke proves `cloudflare.workers.starter-editor` maps to `Step 3 / 5`.
- Browser smoke proves `cloudflare.workers.deploy-review` maps to `Step 4 / 5`.
- Deploy confirmation is shown before advancing past the deploy step.
- The existing completion and missing-target recovery smoke still pass.
- The slice does not add host-page writes, deployment, DNS mutation, storage, or new permissions.

## Test Requirements

- `npm run build:extension && npx playwright test tests/e2e/extension-runtime.spec.ts --project=chromium`
- `npm test`
- `npm run build`
- `npm run test:e2e`
- `git diff --check`
