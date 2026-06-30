# Keyboard Focus Lifecycle PRD

## Problem Statement

Michi now has a compact rail, side panel, command handoff, action bar, and injected extension shell, but keyboard focus is not yet treated as a first-class product state. A keyboard user can open, collapse, reset, and recover the panel, but focus may remain on a removed element or require extra tabbing before the next useful action.

The product problem is continuity: when the panel opens, closes, resets, or collapses from `Escape`, Michi should put focus somewhere predictable without taking over the host page or adding global shortcuts.

## Solution

Add a small keyboard focus lifecycle to the React workbench and injected shell:

1. Opening the side panel moves focus to the most useful panel control.
2. Collapsing the panel returns focus to the rail `Guide` control.
3. Pressing `Escape` collapses the panel without clearing guide or page-check state.
4. Reset keeps the panel open and moves focus to the intent entry.
5. Existing command and action handlers remain unchanged.

## User Stories

1. As a keyboard user, I want opening Michi to focus the guide input or primary panel action, so that I can continue without tabbing through the host page.
2. As a keyboard user, I want minimizing Michi to return focus to the rail, so that focus does not stay on an element that disappeared.
3. As a keyboard user, I want `Escape` to collapse the panel without clearing state, so that I can inspect the host page and reopen Michi later.
4. As a keyboard user, I want reset to return focus to the intent entry, so that I can immediately start another guide.
5. As an evaluator, I want the focus behavior to work in both the React workbench and injected extension shell, so that local and runtime demos behave consistently.
6. As a maintainer, I want focus rules to call existing actions, so that keyboard accessibility does not fork guide behavior.
7. As a maintainer, I want tests to verify focus after open, collapse, Escape, and reset, so that regressions are caught in unit and browser smoke.
8. As a product owner, I want no visible keyboard shortcut teaching text, so that the compact panel stays product-focused.
9. As a security reviewer, I want no new extension commands or permissions, so that keyboard support does not expand runtime scope.
10. As a mobile evaluator, I want the compact rail footprint unchanged, so that this slice does not turn the panel into a larger app surface.

## Implementation Decisions

- Add focus orchestration locally in the UI shells rather than in guide domain state.
- Prefer refs and post-render focus scheduling over new state machine transitions.
- Use existing rail and action handlers for open, close, reset, and check behavior.
- Keep `Escape` scoped to an already-open Michi panel. Do not add a global open shortcut.
- Do not add focus trap behavior; Michi is an embedded panel, not a modal dialog.
- Keep visible copy unchanged. Accessible labels may be used for stable targeting, but no visible shortcut descriptions are introduced.

## Testing Decisions

- Component tests should verify React workbench focus after open, minimize, `Escape`, and reset.
- Injected shell tests should verify focus in the shadow root after open, minimize, `Escape`, and reset.
- Browser smoke should cover at least one desktop and one mobile path where focus does not disappear after collapse.
- Tests should assert user-observable focus and panel state, not internal helper calls.
- Existing product-copy guards should continue to scan visible and accessible text.

## Out of Scope

- No global keyboard shortcut to open Michi.
- No browser extension command registration.
- No command palette.
- No focus trap or modal behavior.
- No visible shortcut hints.
- No persisted focus state across page reloads.
- No new storage, account writes, provider APIs, or extension permissions.

## Further Notes

This slice extends the old injected-shell `Escape` behavior into a complete focus lifecycle. The older spec proved collapse-with-state; this PRD focuses on what happens to keyboard focus before and after collapse.
