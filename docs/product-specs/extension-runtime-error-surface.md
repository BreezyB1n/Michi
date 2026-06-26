# Extension Runtime Error Surface

## Summary

Michi's extension provider already converts Chrome runtime/message failures into controlled unsupported page context. The provider-driven guide UI should make that state explicit: when the extension runtime cannot read the current tab, Michi should show an extension runtime recovery state instead of looking like a generic unsupported page or silent stale context.

## Goals

- Display a clear extension runtime error state when provider context carries `extension-context-unavailable`.
- Explain what failed, why it blocks page anchoring, and how the user can recover.
- Keep manual `Run check` as the retry path.
- Preserve the mock provider as the default local runtime and keep the extension runtime read-only.

## Non-goals

- No new extension permissions, host permissions, storage, network calls, scripting APIs, background polling, or automatic page actions.
- No Chrome Web Store packaging.
- No live Cloudflare account automation.
- No full UI redesign.
- No expansion of the injected content shell to non-Cloudflare origins. Pages without a content script cannot render an injected recovery panel.

## UX Behavior

When Michi cannot read the active Cloudflare tab through the extension runtime, the provider-driven guide UI should show:

- `Extension runtime unavailable`
- the underlying runtime reason from the provider signal
- a recovery action telling the user to open or refresh a supported Cloudflare dashboard tab, then run check again
- no highlighted target
- no normal guide step advancement based on stale page context

This is distinct from an unsupported Cloudflare dashboard area. The injected Cloudflare shell should keep using `Unsupported page` for supported-origin routes that are outside the Workers guide path, such as Analytics. The runtime-unavailable state is for extension/provider failures such as missing runtime, missing content-script receiver, rejected provider requests, or stale async context requests.

## Acceptance Criteria

- Provider failures still return a valid `HostPageContext` instead of throwing.
- Guide Core maps extension runtime unavailable context into recovery.
- The React workbench renders the runtime error title, reason, and retry copy.
- The service worker/provider tests cover missing content-script messaging failures and rejected provider requests.
- The unpacked extension smoke includes a reproducible missing-content-script messaging scenario without adding new permissions.
- Existing supported Workers path, unsupported page, critical confirmation, and completion flows still pass.

## Test Requirements

- `npm test -- tests/serviceWorker.test.ts tests/extensionPageContextProvider.test.ts tests/guideCore.test.ts tests/App.test.tsx`
- `npm run build:extension && npx playwright test tests/e2e/extension-runtime.spec.ts --project=chromium`
- `npm test`
- `npm run build`
- `npm run test:e2e`
- `git diff --check`
