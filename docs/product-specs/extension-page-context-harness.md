# Extension Page Context Harness

## Summary

The unpacked extension runtime smoke still reads page context by embedding the active-tab `chrome.tabs.query` and `chrome.tabs.sendMessage` sequence directly in the E2E test body. Move that page-context request into the extension runtime harness so future browser-runtime checks can reuse one tested path for service-worker-to-content-script context reads.

## Goals

- Add a reusable harness helper that asks the extension service worker to read page context from the active tab.
- Keep the existing `MICHI_GET_PAGE_CONTEXT` message contract unchanged.
- Keep the E2E scenario focused on user-visible extension behavior instead of Chrome API plumbing.
- Preserve the current local unpacked Chromium proof path.

## Non-goals

- No extension manifest, permission, service worker, content script, or guide UI behavior changes.
- No Chrome Web Store packaging or publication.
- No real Cloudflare account or network automation.
- No new Playwright fixture framework.
- No broad PR queue or branch-protection automation.

## Acceptance Criteria

- The extension runtime harness exposes a deterministic page-context request message.
- The harness exposes a service-worker helper for reading page context from the active tab.
- The helper throws the existing explicit error when no active tab id is available.
- The extension runtime E2E uses the helper instead of inline Chrome tab messaging.
- The runtime smoke still proves that a Cloudflare fixture tab returns `MICHI_PAGE_CONTEXT` with the Workers overview route and Create Worker target.

## Test Requirements

- Unit tests cover the request message, happy-path active-tab messaging, and missing-active-tab failure.
- Desktop Chromium extension runtime smoke still passes.
- Full frontend merge gate still passes:
  - `npm test`
  - `npm run build`
  - `npm run test:e2e`
  - `git diff --check`
  - `bash /Users/bytedance/.agents/skills/check/scripts/run-tests.sh`
