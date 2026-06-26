# Extension Injected Critical Confirmation

## Summary

Michi's injected extension shell should require explicit confirmation before advancing past guide steps that represent critical Cloudflare write actions. The shell can now start a guide session, choose backend/API, and browse guide steps. This milestone adds a local confirmation gate for `Create Worker` and other critical steps before the shell previews the next step.

## Goals

- Detect when the active Workers guide step has a `criticalAction`.
- Enter a confirmation state when the user tries to advance past a critical step.
- Show the critical action label and impact copy from the existing guide step fixture.
- Advance to the next guide step only after `Confirm action`.
- Preserve page check, guide navigation, target highlight, recovery guidance, and `Escape` collapse behavior.

## Non-goals

- No real Cloudflare resource creation.
- No automatic clicking, form filling, deployment, DNS mutation, or account writes.
- No persisted confirmation state across reloads.
- No full React content-script runtime.
- No new extension permissions or storage APIs.

## UX Behavior

When the injected shell is on `Step 2 / 5` (`Create a Worker`), clicking `Next step` does not jump directly to `Step 3 / 5`. Instead, Michi shows:

- `Critical write action`
- `Confirm Create Worker`
- the account-impact explanation from the guide step
- `Confirm action`

After `Confirm action`, Michi advances to `Step 3 / 5` (`Review the starter response`).

The same local confirmation behavior applies to future guide steps that define `criticalAction`.

## Acceptance Criteria

- The injected shell blocks advancement past `Create a Worker` until explicit confirmation.
- Confirmation copy includes the critical action label and impact.
- `Confirm action` advances to the next guide step.
- Confirmation does not trigger host-page clicks, writes, deployment, or new permissions.
- Unit and Playwright coverage verify the injected confirmation path.

## Test Requirements

- `npm test`
- `npm run build`
- `npm run test:e2e`
