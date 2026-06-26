# Extension Reducer Reset Bridge

## Summary

Michi's injected extension shell needs a visible way to restart the local guide without reloading the host Cloudflare page. The shell already routes intent, service choice, navigation, confirmation, completion, and page-check projection through `guideSessionReducer`. This slice adds a compact panel-level Reset action that uses the reducer reset transition and clears shell-only page evidence.

## Goals

- Add a Reset control inside the expanded guide panel.
- Route Reset through `guideSessionReducer({ type: "reset" })` before projecting back into compact shell state.
- Clear checked `HostPageContext`, target highlight, recovery copy, completion copy, active step, and shell intent.
- Keep the shell open after reset so the user can immediately enter a new intent.
- Preserve the collapsed rail footprint with only `Guide` and `Check page`.

## Non-goals

- No full `GuideSession` store inside the injected shell.
- No React extension panel migration.
- No manifest, permission, storage, network, backend, database, Cloudflare account, or Cloudflare automation change.
- No host page navigation, reload, DOM mutation outside the Michi Shadow DOM, or destructive write action.
- No global keyboard shortcut for reset.

## UX Behavior

When the guide panel is open, the header shows a Reset control next to Min. Pressing Reset returns the panel to the intent entry state, clears the latest page check and target highlight, and keeps the panel open.

Reset should work from:

- an active Workers guide step
- a critical confirmation state
- a recovery state
- the static-site acknowledgement state
- the completed DNS follow-up state

The rail remains unchanged. `Guide` opens the panel and `Check page` reads the current page context; no Image, Video, or other broad controls are added.

## Domain Behavior

The injected shell still stores compact render state. Reset is calculated by creating a reducer session, dispatching `reset`, and projecting the reset result back into shell state. Because `GuideSession` does not own the shell's last checked `HostPageContext`, the shell event handler clears `state.context` after the reducer projection.

## Acceptance Criteria

- Bridge helper exposes a reducer-backed reset projection.
- The injected panel renders a Reset control only when expanded.
- Reset returns the shell to intent entry and keeps the panel open.
- Reset clears route, target, evidence, recovery guidance, completion follow-up, and target highlight.
- Reset preserves the small rail shape: only `Guide` and `Check page`.
- Existing guide, page check, confirmation, completion, recovery, collapse, and highlight flows still pass.

## Test Requirements

- `npm test -- tests/extensionGuideSessionBridge.test.ts tests/injectedShell.test.ts`
- `npm test`
- `npm run build`
- `npm run test:e2e`
- `git diff --check`
- `bash /Users/bytedance/.agents/skills/check/scripts/run-tests.sh`
