# Extension Runtime Probe Boundary

## Summary

The unpacked extension runtime smoke currently owns two responsibilities in one large E2E file: exercising Michi's injected guide shell and installing/launching a runtime probe page. Move the runtime probe and persistent Chromium launch setup into test support so the E2E file stays focused on user-visible extension behavior.

## Goals

- Extract runtime-probe HTML/JavaScript generation from `tests/e2e/extension-runtime.spec.ts`.
- Extract unpacked-extension launch arguments and probe URL construction into reusable test support.
- Keep the smoke path deterministic: build `dist-extension`, load unpacked Chromium, open Cloudflare fixture pages, and verify runtime messaging.
- Preserve the existing extension permissions, manifest, service worker, content script, and guide shell behavior.

## Non-goals

- No Chrome Web Store packaging, publishing, or real account automation.
- No real Cloudflare network dependency.
- No manifest permission changes.
- No new guide capability, provider, or browser UI behavior.
- No broad Playwright fixture framework beyond the current runtime smoke.

## Acceptance Criteria

- Runtime probe assets are built by a support module rather than inline in the E2E smoke.
- The support module can install the probe files into `dist-extension`.
- The support module exposes the launch arguments used to load the unpacked extension.
- The support module exposes the `chrome-extension://<id>/runtime-probe.html` URL builder.
- The extension runtime E2E still verifies:
  - rail injection
  - guide open/start/check flow
  - Workers and Pages anchors
  - route mismatch recovery
  - target-missing/unsupported recovery
  - service worker page-context messaging
  - runtime probe failure when no content-script tab can receive the message

## Test Requirements

- Unit tests cover probe asset generation, probe installation, launch args, and probe URL construction.
- Desktop Chromium extension runtime smoke still passes.
- Full frontend merge gate still passes:
  - `npm test`
  - `npm run build`
  - `npm run test:e2e`
  - `git diff --check`
  - `bash /Users/bytedance/.agents/skills/check/scripts/run-tests.sh`
