# Cloudflare Pages Guide Path

## Summary

Michi should no longer treat `static-site` intent as a terminal acknowledgement. Static website intent should route to a deterministic Cloudflare Pages guide path in the React workbench and injected extension shell, while preserving the existing Workers path as the primary backend/API path.

## Goals

- Map `static-site` clarification to Cloudflare Pages with guide steps instead of immediate completion.
- Add Pages steps for locating Workers & Pages, creating a Pages project, choosing static assets, deploying the project, and verifying the Pages URL.
- Extend local page reading and guide anchoring to Pages fixtures.
- Show Pages capability, step titles, purpose, completion checks, critical deploy confirmation, completion evidence, and DNS follow-up in both browser surfaces.
- Keep the extension Cloudflare-only and read-only.

## Non-goals

- No real Cloudflare account, Pages project creation, Git provider integration, upload flow, backend API, storage, network writes, or automated Cloudflare action.
- No manifest permission expansion.
- No React rewrite of the injected shell.
- No change to the Workers happy path or DNS follow-up semantics.
- No Google Chrome Web Store packaging or release work.

## UX Behavior

When the user chooses `Static website`, Michi starts a Cloudflare Pages guide:

1. Find the Workers & Pages entry.
2. Create a Pages project.
3. Choose the static assets flow.
4. Deploy the Pages project with explicit confirmation.
5. Verify the Pages URL.

Completion shows Pages URL evidence and recommends Cloudflare DNS as the follow-up route. The injected shell can also anchor directly from supported Pages page contexts when the user presses `Check page`.

## Domain Behavior

`GuideSession.serviceKind` remains the path discriminator:

- `backend-api` uses Workers steps and page states.
- `static-site` uses Pages steps and page states.

The reducer remains the source of session transition truth. The injected shell keeps compact render state but stores `serviceKind` so reducer projections can reconstruct the correct path.

## Acceptance Criteria

- Choosing `Static website` starts a Pages guide at Step 1 instead of completing immediately.
- Pages steps include action, purpose, completion check, expected route, and target id.
- Pages deploy step requires explicit confirmation before advancing.
- Pages final step completes only when a Pages URL success signal is present.
- Page reader detects Pages overview, static assets setup, deploy review, and deploy result routes.
- Injected shell renders Pages guide copy, highlights Pages targets, handles Reset, and keeps rail controls limited to `Guide` and `Check page`.
- Existing Workers guide behavior, recovery, reset, completion, and extension permission guard remain unchanged.

## Test Requirements

- `npm test -- tests/guideSessionReducer.test.ts tests/guideCore.test.ts tests/workersGuideFlow.test.ts tests/cloudflarePageReader.test.ts tests/extensionGuideSessionBridge.test.ts tests/injectedShell.test.ts tests/App.test.tsx`
- `npm test`
- `npm run build`
- `npm run test:e2e`
- `git diff --check`
- `bash /Users/bytedance/.agents/skills/check/scripts/run-tests.sh`
