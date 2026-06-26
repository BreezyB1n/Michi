# Extension Injected Completion Follow-up

## Summary

Michi's injected extension shell should be able to finish the Cloudflare Workers guide path after the page check finds a deployed Worker URL. The completion state should summarize that the primary path is done and recommend Cloudflare DNS as the next follow-up capability route.

## Goals

- Detect completion evidence from the existing Cloudflare page reader.
- Let the user complete the injected guide only when the active guide step is `Verify the Worker URL` and the checked page contains Worker URL evidence.
- Show a compact completion state in the injected panel.
- Recommend `Cloudflare DNS` as the follow-up route after the Worker URL is verified.
- Preserve guide start, page check, navigation, critical confirmation, recovery guidance, target highlight, and `Escape` collapse behavior.

## Non-goals

- No DNS binding or DNS record mutation.
- No automatic deployment, clicking, form filling, navigation, or Cloudflare account write.
- No production Chrome Web Store packaging.
- No new extension permissions, storage APIs, backend service, or LLM runtime.
- No full React content-script migration in this slice.

## UX Behavior

When the injected shell checks a Cloudflare deployment-result page that contains a Worker URL, Michi shows `Step 5 / 5` with the Worker URL target and success evidence. The final action becomes `Complete guide`.

After `Complete guide`, Michi shows:

- `Primary path complete`
- `Worker URL verified`
- the Worker URL evidence from the page check
- `Follow-up route`
- `Cloudflare DNS`
- the DNS capability explanation

If the user reaches `Step 5 / 5` without Worker URL success evidence, the guide does not enter completion. The user should run `Check page` on the deployment result page first.

## Acceptance Criteria

- The injected shell can complete the Workers guide after detecting a Worker URL on the current Cloudflare page.
- Completion is gated by final-step context and success evidence, not by local navigation alone.
- The completion state includes Cloudflare DNS as the follow-up route.
- Completion does not trigger host-page clicks, deployment, DNS writes, storage writes, or new permissions.
- Unit and Playwright coverage verify the injected completion path.

## Test Requirements

- `npm test -- tests/injectedShell.test.ts`
- `npm test`
- `npm run build`
- `npm run test:e2e`
- `git diff --check`
