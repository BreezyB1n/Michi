# Michi Browser Extension Runtime Spike Product Spec

## Summary

Michi's third milestone proves that the Guide UI can receive real page context from a browser extension runtime.

The milestone should keep the current local demo and mock provider, but add a minimum Manifest V3 extension path that can be loaded as an unpacked extension during development. The extension should read the current page through a content script, normalize the result into `HostPageContext`, and provide that context to Michi through a narrow provider boundary.

This is a runtime spike, not a production extension release. The goal is to validate the browser-extension data pipe before adding LLM reasoning, generalized page understanding, or automated actions.

## Approved Design Summary

### Building

Build a development-only Chrome/Arc-compatible MV3 extension runtime that can collect real page context and feed it into Michi's existing page anchoring contract. The extension will use a content script for DOM access, a service worker for extension coordination, and the existing Michi guide shell as the page-attached UI direction.

### Not Building

- No Chrome Web Store submission.
- No production packaging or signing.
- No live Cloudflare write automation.
- No LLM-backed reasoning.
- No generic website support beyond Cloudflare-oriented route and target detection.
- No automatic clicking, form submission, deployment, DNS edits, or account mutation.
- No `chrome.sidePanel` primary UI in this milestone.
- No broad `<all_urls>` host access.

### Approach

Use the official Manifest V3 model with a statically declared content script for Cloudflare dashboard pages. The content script reads the page with standard DOM APIs, extracts a bounded set of interactive elements and page signals, and emits a normalized `HostPageContext`. A service worker handles extension lifecycle and message routing. The existing mock provider remains the default for local demo and tests, while the extension provider becomes an additional runtime adapter.

This plan assumes the first real target page is `https://dash.cloudflare.com/*`. If the first target becomes a different product, the extension scaffold still holds, but the Cloudflare detector and permission scope must change before implementation.

### Key Decisions

- Keep the current page-attached rail and panel as Michi's primary UI because Milestone 3 is about page anchoring, not browser-level workspace management.
- Use content scripts for DOM reading because the service worker cannot inspect page DOM directly.
- Use one-time messages for context refresh because the product already has a manual `Check` control and does not need streaming page observation yet.
- Keep the mock provider as the default local runtime because deterministic demo and regression tests should not depend on Chrome extension APIs.
- Scope host matching to Cloudflare dashboard pages because a broad permission model would test the wrong risk for this milestone.

### Unknowns

- No blocking unknowns for this milestone.
- Deferred product question: whether Michi later needs Chrome Side Panel as a secondary history or settings surface. Owner: future extension-product spec after page anchoring works.
- Deferred technical question: exact selector stability on live Cloudflare pages. Owner: Milestone 3 implementation, validated with fixture pages first and optional real-session manual checks second.

## Official Platform Decisions

### Manifest V3

Use Manifest V3 because it is the current Chrome extensions platform and uses service workers instead of long-lived background pages.

Required development manifest direction:

- `manifest_version: 3`
- extension `action` for toolbar entry
- `background.service_worker` for lifecycle and routing
- `content_scripts` matched only to Cloudflare dashboard pages
- minimal permissions; avoid broad host access

### Content Script

Use a content script for page context collection because it can run in the context of web pages, read DOM details, and pass information to the parent extension.

The content script must:

- read `window.location.href`
- read `document.title`
- inspect visible text and selected interactive elements
- detect known Cloudflare guide targets
- never execute page-provided scripts
- never use `eval`, string-based timers, or remote code
- sanitize all text before sending it across the extension boundary

### Messaging

Use one-time request/response messaging for Milestone 3.

Long-lived connections are out of scope until Michi needs streaming page updates, high-frequency DOM observation, or multi-step in-page sessions that cannot be represented by manual re-checks.

Initial message contracts:

```ts
type MichiRuntimeMessage =
  | { type: "MICHI_GET_PAGE_CONTEXT" }
  | { type: "MICHI_PAGE_CONTEXT"; context: HostPageContext }
  | { type: "MICHI_PAGE_CONTEXT_ERROR"; reason: string };
```

### Side Panel API

Do not use the Side Panel API as the primary UI in this milestone. Chrome's Side Panel API is useful for persistent companion experiences, but Michi's immediate product risk is page anchoring: the guide needs to point at and reason about the current page. A page-attached rail/panel remains the right first surface.

Side Panel may be reconsidered later for secondary history, settings, or cross-tab workspace views.

## Product Principles

### Read Before Acting

The extension runtime only reads page state in this milestone. It does not click, type, submit forms, or trigger Cloudflare actions.

### Narrow Permissions

The extension should request the smallest useful scope. The initial host match is Cloudflare dashboard only. If the extension is not on a supported page, Michi should show unsupported context instead of requesting broader access.

### Keep Mock and Real Providers Side by Side

The mock provider remains the stable test surface. The real extension provider is validated separately so browser runtime work does not destabilize local product demos.

### Page-Attached First

Michi should remain visually lightweight and anchored to the page. The browser extension runtime should support the existing rail and panel behavior rather than replacing it with a full browser-side workspace.

## Runtime Architecture

```
Cloudflare page DOM
        |
        v
content script
  - reads URL/title/text/controls
  - detects Cloudflare route and targets
  - normalizes HostPageContext
        |
        v
service worker
  - routes messages
  - handles extension lifecycle
  - exposes latest page context on request
        |
        v
Michi provider adapter
  - implements PageContextProvider
  - returns HostPageContext
        |
        v
Guide Core + Guide UI
  - applies context
  - shows anchor, recovery, confirmation
```

There should be no cycle from Guide Core back into content script actions in this milestone. Guide Core consumes context only.

## Functional Requirements

### Extension Scaffold

- The repository provides an extension build output that contains a root `manifest.json`.
- The unpacked extension can be loaded from Chrome/Arc developer mode.
- The extension includes a toolbar action with a clear title such as `Michi`.
- The extension uses Manifest V3.
- The extension does not depend on remote JavaScript.

### Content Script Page Reader

The content script must produce enough information to fill `HostPageContext`.

Minimum extracted fields:

- `url`
- `title`
- `locationLabel`
- `routeId`
- `detectedAt`
- `targets`
- `signals`

Minimum target detection:

- Workers & Pages navigation
- Create Worker action
- starter handler/editor region
- Deploy action
- Worker URL or deployment result signal

Minimum target attributes:

- stable `id`
- human-readable `label`
- `role`
- visible `text`
- confidence level
- optional bounding box

### Cloudflare Route Detection

The first detector should be Cloudflare-specific and deterministic.

Supported route IDs:

- `cloudflare.dashboard.home`
- `cloudflare.workers.overview`
- `cloudflare.workers.starter-editor`
- `cloudflare.workers.deploy-review`
- `cloudflare.workers.deploy-result`
- `cloudflare.unsupported`

When the detector cannot classify the page, it returns `cloudflare.unsupported` with an informational signal.

### Provider Adapter

The extension provider adapter implements the same `PageContextProvider` interface introduced in Milestone 2.

Required behavior:

- `getCurrentContext()` requests context from the active tab.
- unsupported pages return a valid `HostPageContext` with no targets.
- extension messaging failures return a controlled error context rather than throwing into the UI.
- the mock provider remains available and is not replaced.

### UI Integration

Michi's existing shell should be able to run with either provider.

Runtime selection:

- local Vite demo uses the mock provider by default.
- extension build uses the extension provider.

The guide UI should not need to know whether context came from mock data or a real content script.

### Recovery

If the extension provider reports a route mismatch, no targets, or a missing expected target, Guide Core should enter page-drift recovery using the existing `BlockingState["id"] === "page-drift"` behavior.

Recovery copy should explain:

- current detected route
- expected guide route or target
- user action to return to the expected page

## Non-Functional Requirements

### Security

- No remote code execution.
- No `eval`.
- No string-based `setTimeout` or `setInterval`.
- No broad host permission in the initial spike.
- No page text is sent to external services.
- No account identifiers are persisted.
- DOM text collected for targets and signals should be bounded in length.

### Privacy

- Context collection is local to the browser extension runtime.
- The spike stores no browsing history.
- The spike does not persist full DOM snapshots.
- The spike does not transmit page content outside the browser.

### Performance

- Page scanning should be bounded to visible candidate elements.
- Avoid continuous high-frequency DOM observation in Milestone 3.
- A manual `Check` action is enough for refreshing context.
- If MutationObserver is added later, it must be throttled and covered by tests.

### Compatibility

- Primary target: Chrome/Arc Chromium desktop with Manifest V3 support.
- Minimum supported Chrome version should be documented if `chrome.sidePanel` or newer APIs are introduced later.
- Milestone 3 should not depend on Side Panel availability.

## Acceptance Criteria

- A developer can build an unpacked extension artifact from the repo.
- The artifact includes a valid root `manifest.json`.
- The extension can be loaded locally through Chrome/Arc developer mode.
- On a supported Cloudflare dashboard page, the content script returns a `HostPageContext`.
- The returned context includes URL, title, route ID, location label, signals, and targets.
- The existing Michi guide UI can consume the extension provider without changing Guide Core.
- Unsupported pages return a controlled unsupported context.
- Missing expected targets trigger page-drift recovery.
- The mock provider remains the default for local demo tests.
- No live Cloudflare write action is performed.

## Implementation Slices

### Slice 1: Extension Build Scaffold

- Add a development extension entrypoint without changing the local Vite demo default.
- Produce a build output directory with root `manifest.json`.
- Include MV3 `action`, `background.service_worker`, and Cloudflare-only `content_scripts`.
- Add package scripts for building the extension artifact.
- Verify the artifact contains no remote JavaScript references.

### Slice 2: Shared Runtime Contract

- Reuse the existing `HostPageContext`, `PageTarget`, `PageSignal`, and `PageContextProvider` types.
- Add extension runtime message types near the provider boundary.
- Keep Guide Core independent of Chrome APIs.
- Keep local mock provider exports intact.

### Slice 3: Cloudflare Page Reader

- Add a pure DOM extraction module that can be tested with fixture HTML.
- Detect supported Cloudflare route IDs deterministically.
- Extract visible targets and bounded text only.
- Return `cloudflare.unsupported` when route or target detection fails.
- Cover hidden elements, long text, and missing target cases with unit tests.

### Slice 4: Extension Messaging and Provider Adapter

- Add content script request handling for `MICHI_GET_PAGE_CONTEXT`.
- Add service worker routing to request page context from the active tab.
- Add an extension provider that implements `PageContextProvider`.
- Map messaging errors into controlled unsupported or error contexts.
- Ensure provider failures do not crash the Guide UI.

### Slice 5: UI Runtime Selection and Verification

- Keep local demo on the mock provider.
- Use extension provider only in the extension runtime build.
- Keep `Guide`, `Check`, and `Min` rail behavior unchanged.
- Show unsupported context and page-drift recovery through the existing UI.
- Run existing local regression tests plus automated unpacked-extension fixture validation.
- Leave real Cloudflare-session validation as a manual follow-up until Michi injects or packages an interactive extension UI surface.

## Expected Implementation Scope

This milestone is expected to touch more than eight files because it introduces a browser-extension runtime path alongside the existing Vite app. Expected areas:

- extension manifest and build entrypoints
- content script
- service worker
- extension provider adapter
- Cloudflare DOM detector
- fixture HTML or test helpers
- package scripts
- unit, component, and browser-runtime checks
- existing UI runtime-selection seam

No new backend service, database, API key, or remote account integration is required.

## Risk Checks

### Dependency Failure

If Chrome extension APIs are unavailable, Michi should keep running in local demo mode with the mock provider. Extension provider creation must be guarded behind runtime selection.

### Scale Explosion

The first likely failure at larger page size is DOM scanning cost. The detector should inspect bounded candidate selectors and visible interactive elements instead of walking and storing the full DOM.

### Rollback Cost

Rollback should remove the extension entrypoints and provider adapter without touching Guide Core, the mock provider, or current local demo behavior.

## Test Requirements

### Unit Tests

- Cloudflare detector classifies supported route fixtures.
- Cloudflare detector returns `cloudflare.unsupported` for unsupported pages.
- DOM extraction ignores hidden elements.
- DOM extraction bounds text length.
- Extension provider maps successful messages to `HostPageContext`.
- Extension provider maps messaging failures to controlled error context.

### Component Tests

- Guide UI works with mock provider.
- Guide UI works with a fake extension provider that returns real-context-shaped data.
- Unsupported context is visible without crashing.
- Missing expected target produces page-drift recovery.

### Browser Runtime Checks

- Build the extension artifact before browser runtime checks.
- Launch Chromium with the generated unpacked extension through Playwright `launchPersistentContext`.
- Open a routed `https://dash.cloudflare.com/*` fixture page so the manifest match and content script path are exercised.
- Ask the extension runtime to message the active tab content script and return `HostPageContext`.
- Confirm the page context shows route, target, and evidence from the content script.
- Keep unsupported-page behavior covered by unit/provider tests until an interactive extension UI is available.

### Existing Regression Tests

- `npm test`
- `npm run build`
- `npm run test:e2e`
- desktop and mobile no-horizontal-overflow checks for the local demo

## Rollback

Rollback is low cost because this milestone adds an adapter path. If the extension spike is wrong, remove the extension build entrypoints and keep the mock provider, Guide Core, and local web demo intact.

No data migration is required.

## Dependencies

- Chrome/Arc desktop with extension developer mode enabled for manual validation.
- No API keys.
- No Cloudflare credentials are required for automated tests.
- A real Cloudflare session may be useful for manual validation, but the implementation must also support local fixture pages.

## References

- [Chrome Extensions Manifest V3 migration overview](https://developer.chrome.com/docs/extensions/develop/migrate)
- [Chrome manifest file format](https://developer.chrome.com/docs/extensions/reference/manifest)
- [Chrome content scripts](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts)
- [Chrome extension message passing](https://developer.chrome.com/docs/extensions/develop/concepts/messaging)
- [Chrome Side Panel API](https://developer.chrome.com/docs/extensions/reference/api/sidePanel), recorded here as a reviewed but intentionally deferred platform option.
