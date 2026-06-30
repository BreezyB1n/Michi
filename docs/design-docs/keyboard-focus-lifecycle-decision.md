# Keyboard Focus Lifecycle Decision

## Decision

Michi will manage keyboard focus as local UI shell behavior. Opening, collapsing, escaping, and resetting the panel should move focus to the next useful control, while guide state and page context remain owned by the existing reducers and runtime adapters.

## Context

The side panel behaves like an embedded product surface, not a modal. Keyboard users need predictable focus movement, but Michi should not register global shortcuts, trap focus, or show visible keyboard-instruction copy. The current injected shell already collapses on `Escape`; this decision extends that behavior into a complete, tested focus lifecycle across the React workbench and injected shell.

## Rationale

- Focus orchestration belongs in the UI shell because it is presentation behavior, not guide domain state.
- Existing action handlers should remain the only way to mutate guide state.
- Returning focus to the rail after collapse prevents focus from staying on removed panel controls.
- Focusing the intent entry after reset makes the next guide immediately operable.
- Avoiding global shortcuts keeps Michi non-invasive on host pages and avoids extension command permissions.

## Consequences

- React and injected shell will use small focus helpers after render.
- Tests should check `document.activeElement` or `shadow.activeElement` instead of helper internals.
- Future command-palette or shortcut work needs a new spec; it is intentionally not smuggled into this slice.
- No manifest, permission, storage, package, or runtime reader changes are expected.

## Non-Goals

- No focus trap.
- No global shortcut capture.
- No extension command registration.
- No visible keyboard shortcut instructions.
- No host-page DOM mutation beyond the existing injected shell.
