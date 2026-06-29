# Command Handoff PRD

## Problem Statement

Michi now shows guide state, page checks, activity history, and critical confirmations, but the user still has to scan several regions to decide what to do next. The panel should make the next safe action obvious without taking over the host page or turning into a full command center.

The product problem is handoff: when Michi reaches intent entry, clarification, guide progress, confirmation, recovery, completion, or reset, the panel should answer:

1. What action is most useful right now?
2. Why is that action safe or necessary?
3. What secondary action is available without changing the guide contract?
4. Which actions are intentionally blocked until the user confirms or recovers?

## Solution

Add a compact command handoff region to the existing Michi side panel. The handoff is state-driven, product-only, and local. It recommends one primary action and a small set of secondary actions derived from the current guide session.

The region should not parse arbitrary commands or automate account changes. It should organize the actions Michi already supports: start, choose path, check, advance, confirm, recover, complete, minimize, and reset. Critical actions remain explicit confirmations, and recovery states remain blocking until a recovery check succeeds.

## User Stories

1. As a user, I want Michi to tell me the best next action, so that I do not have to infer it from multiple panels.
2. As a user, I want the recommended action to explain why it matters, so that I trust the guide state.
3. As a user, I want critical write actions to stay visibly separate, so that I do not accidentally continue through a risky step.
4. As a user, I want recovery to appear as the only forward path when the page is blocked, so that I understand why normal progress paused.
5. As a user, I want completion to suggest the follow-up route without starting it automatically, so that I stay in control.
6. As a mobile user, I want the handoff to stay compact, so that the host page remains the primary surface.
7. As a keyboard user, I want command buttons to have clear accessible names, so that the handoff is usable without relying on visual layout.
8. As an evaluator, I want the handoff copy to be Michi product language, so that the product does not look tied to one provider.
9. As a maintainer, I want the command list to come from a typed domain model, so that React and injected-shell behavior do not drift apart.
10. As a maintainer, I want tests to prove blocked states cannot be bypassed, so that command convenience does not weaken confirmation or recovery safety.

## Implementation Decisions

- Build a shared local command handoff model that accepts a guide session and returns display-safe commands.
- Use one primary command and optional secondary commands instead of an open command palette.
- Keep command IDs stable enough for tests and browser assertions.
- Render the handoff inside the existing side panel scroll area, above activity history.
- Render a smaller handoff summary in the injected shell so the real extension surface has parity without growing wider.
- Preserve existing action handlers and reducer transitions. The handoff invokes existing actions rather than creating new transitions.
- Do not add storage, analytics, keyboard shortcut capture, remote command execution, backend APIs, or new extension permissions.

## Testing Decisions

- Unit tests should cover command generation for intent, clarify, guide, confirm, recovery, and complete phases.
- Unit tests should prove confirmation and recovery states expose only safe forward actions.
- Component tests should verify the React handoff renders the recommended action and invokes existing handlers.
- Injected shell tests should verify the handoff appears inside the shadow panel and keeps product-only copy.
- Browser smoke should verify the handoff remains compact on desktop and mobile and does not introduce horizontal overflow.
- Existing product-copy guards should scan the new handoff text and accessibility attributes.

## Out of Scope

- No natural language command parser.
- No global overlay or launcher.
- No keyboard shortcut system.
- No persisted task queue.
- No autonomous writes.
- No new provider integration.
- No public extension listing work.
- No new permissions or backend services.

## Further Notes

Design reference:

- Raycast: the recommended action is explicit and fast to scan.
- Linear: workflow state is dense but ordered around the next decision.
- Sitegeist-style side panel: the product stays embedded and compact instead of occupying the full page.

The handoff should feel like a small operator console inside Michi, not a new app inside the browser.
