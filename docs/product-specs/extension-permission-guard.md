# Extension Permission Guard

## Summary

Michi's extension runtime must stay Cloudflare-only and read-only while the product is still a local guide shell. This slice adds automated guardrails around the extension manifest and extension source so future frontend work cannot silently broaden permissions, persist browser data, call external networks, or add script-injection capabilities.

## Goals

- Lock the MV3 manifest to `activeTab` and the existing Cloudflare dashboard content-script match.
- Prevent `host_permissions`, `optional_permissions`, `optional_host_permissions`, `chrome.storage`, `chrome.scripting`, `fetch`, `sendBeacon`, and `XMLHttpRequest` from entering the extension runtime without an intentional spec update.
- Keep the extension source local and deterministic.
- Document the permission boundary as an explicit product contract.

## Non-goals

- No new runtime permission, host permission, service, API, telemetry, storage, or real Cloudflare automation.
- No production Chrome Web Store packaging.
- No change to the injected UI layout or guide behavior.
- No attempt to prove Cloudflare's live dashboard markup is stable.

## UX Behavior

There is no new visible UI. The user-facing guarantee is negative: Michi remains a narrow guide overlay that reads the active Cloudflare dashboard page and does not store, transmit, or mutate user/account data.

## Acceptance Criteria

- A test fails if the manifest permissions differ from `["activeTab"]`.
- A test fails if the manifest adds `host_permissions`, `optional_permissions`, `optional_host_permissions`, or expands content-script matches beyond `https://dash.cloudflare.com/*`.
- A test fails if the extension entry dependency graph imports or references `chrome.storage`, `chrome.scripting`, `fetch`, `navigator.sendBeacon`, or `XMLHttpRequest`.
- A fixture test proves the scanner follows static and dynamic relative imports outside `src/extension` and blocks common spellings such as `window.fetch`, `globalThis.fetch`, bracket access, and destructuring.
- Existing extension build and browser smoke still pass.

## Test Requirements

- `npm test -- tests/extensionPermissionGuard.test.ts`
- `npm run build:extension`
- `npm test`
- `npm run build`
- `npm run test:e2e`
- `git diff --check`
