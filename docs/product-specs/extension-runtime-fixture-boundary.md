# Extension Runtime Fixture Boundary

## Summary

Michi's unpacked extension runtime smoke should keep browser-runtime behavior separate from Cloudflare dashboard fixture markup. The current smoke test embeds all route-specific HTML directly in `tests/e2e/extension-runtime.spec.ts`, which makes the test hard to extend and blurs the line between runtime assertions and demo page fixtures.

This slice extracts the Cloudflare fixture page factory into a test-support module while preserving the same extension runtime behavior and visible smoke path.

## Goals

- Move Cloudflare dashboard fixture HTML generation out of the e2e test body.
- Keep the e2e test focused on user-visible extension behavior: rail injection, guide panel, page checks, target highlights, recovery, and service-worker context reads.
- Make fixture routes explicit and reusable for future Workers, Pages, unsupported, missing-target, and scroll scenarios.
- Preserve the current Cloudflare-only runtime scope and fixture realism.
- Keep the extracted fixture module test-only and out of the extension production bundle.

## Non-goals

- No extension manifest, permission, content script, service worker, guide reducer, or injected-shell behavior changes.
- No new Cloudflare routes or guide steps.
- No real Cloudflare account access or live network dependency.
- No Chrome Web Store packaging.
- No generalized website fixture framework.

## User-Visible Behavior

There should be no visible behavior change. The existing unpacked extension smoke should still:

- load the extension as an unpacked Chromium extension;
- inject the collapsed Michi rail on a Cloudflare-like page;
- expand the guide panel;
- read Workers and Pages page context from the content script;
- highlight matching page targets;
- preserve unsupported and missing-target recovery checks;
- avoid extra rail controls such as `Image` or `Video`.

## Acceptance Criteria

- `tests/e2e/extension-runtime.spec.ts` no longer contains the route-specific Cloudflare HTML body.
- A test-support fixture module owns Cloudflare fixture route detection and HTML generation.
- Unit tests cover the fixture module for Workers overview, Pages overview, deployment-result, unsupported, missing-target, and nested-scroll variants.
- The existing extension runtime Playwright smoke still passes.
- The fixture support module is imported only from tests.

## Test Requirements

- `npm test -- tests/cloudflareDashboardFixture.test.ts`
- `npm run test:e2e -- tests/e2e/extension-runtime.spec.ts --project=chromium`
- `npm test`
- `npm run build`
- `npm run test:e2e`
- `git diff --check`
- `bash /Users/bytedance/.agents/skills/check/scripts/run-tests.sh`
