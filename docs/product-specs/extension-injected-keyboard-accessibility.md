# Extension Injected Keyboard Accessibility

## Summary

Michi's injected extension shell should behave like a compact browser-side panel. Users need a quick keyboard way to dismiss the panel without losing the latest page check context. This milestone adds `Escape` collapse behavior to the injected shell while preserving the checked route, target, evidence, recovery guidance, and highlight state.

## Goals

- Collapse the injected guide panel when the user presses `Escape`.
- Preserve the latest `HostPageContext` after collapse.
- Reopen the panel from the `Guide` rail button with the previous check result still visible.
- Keep the rail controls unchanged.
- Keep the behavior local to the injected shell.

## Non-goals

- No global keyboard shortcut for opening Michi.
- No command palette.
- No focus trap or modal behavior.
- No browser extension command registration.
- No persisted state across page reloads.

## UX Behavior

When the panel is open, pressing `Escape` hides the panel. The rail stays visible. If the user clicks `Guide` again, the panel reopens and shows the latest page check result instead of returning to the empty state.

If no page check has run yet, pressing `Escape` simply hides the empty panel.

## Acceptance Criteria

- The injected shell collapses the panel on `Escape`.
- `Escape` does not clear the current `HostPageContext`.
- Reopening the panel after `Escape` shows the prior route, target, and evidence.
- `Guide` and `Check page` remain the only rail controls.
- Unit and Playwright coverage verify the keyboard collapse path.
