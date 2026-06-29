# Runtime Context Boundary Issue Breakdown

This is a `to-issues` draft for the runtime context boundary PRD. It should be reviewed before publishing to GitHub because the repository currently has GitHub Issues enabled but no `ready-for-agent` label.

## Proposed Vertical Slices

1. **Define provider-neutral page context adapter contract**
   - **Type**: AFK
   - **Blocked by**: None
   - **User stories covered**: 9, 10, 11, 16

2. **Move the current provider reader behind the adapter boundary**
   - **Type**: AFK
   - **Blocked by**: Slice 1
   - **User stories covered**: 2, 4, 5, 9, 12

3. **Normalize unsupported and failure context through product language**
   - **Type**: AFK
   - **Blocked by**: Slice 1
   - **User stories covered**: 3, 7, 10, 11

4. **Separate demo fixtures from runtime adapter tests**
   - **Type**: AFK
   - **Blocked by**: Slice 2
   - **User stories covered**: 8, 11, 12, 13

5. **Add product-only runtime copy regression coverage**
   - **Type**: AFK
   - **Blocked by**: Slices 2 and 3
   - **User stories covered**: 1, 3, 7, 10

6. **Confirm permission and publishing boundary**
   - **Type**: HITL
   - **Blocked by**: None
   - **User stories covered**: 14, 16

## Issue Drafts

### 1. Define provider-neutral page context adapter contract

## What to build

Define the narrow adapter contract that Michi runtime code uses to read host page context. The contract should preserve the existing page-understanding vocabulary while making provider-specific readers pluggable behind a product-neutral interface.

## Acceptance criteria

- [ ] A provider-neutral adapter interface exists for reading current page context.
- [ ] Existing page context types remain the public vocabulary for route, targets, signals, blocking state, and detected time.
- [ ] Existing React workbench and extension runtime behavior does not change.
- [ ] Unit tests prove the adapter contract can represent normal, unsupported, and failed context.

## Blocked by

None - can start immediately.

### 2. Move the current provider reader behind the adapter boundary

## What to build

Move the existing supported provider page reader into the first adapter implementation. Runtime callers should depend on the adapter boundary instead of importing provider-specific reader functions directly.

## Acceptance criteria

- [ ] The content script reads context through the adapter boundary.
- [ ] Existing supported fixture pages still produce the same guide route, target, and signal behavior.
- [ ] Extension smoke still loads the unpacked extension and reads context through the content script.
- [ ] No manifest permission is added or widened.

## Blocked by

- Slice 1.

### 3. Normalize unsupported and failure context through product language

## What to build

Route unsupported page context, timeout context, and runtime failure context through product-neutral copy before visible rendering. Provider-specific failure reasons may stay in logs or tests, but the shell should explain product state and recovery action.

## Acceptance criteria

- [ ] Unsupported context visible copy avoids provider product names.
- [ ] Runtime failure visible copy avoids provider product names.
- [ ] Recovery copy explains what happened, why it blocks progress, and how to proceed.
- [ ] React and injected shell tests cover unsupported and runtime-failure rendering.

## Blocked by

- Slice 1.

### 4. Separate demo fixtures from runtime adapter tests

## What to build

Keep fixture HTML and route generation in test support, while adapter tests exercise the adapter contract and selected fixture pages without leaking fixture structure into product runtime modules.

## Acceptance criteria

- [ ] Fixture helpers remain in test support modules.
- [ ] Adapter tests cover route, target, signal, missing target, and completion evidence.
- [ ] Product runtime modules do not import fixture helpers.
- [ ] Existing extension runtime smoke remains end-to-end.

## Blocked by

- Slice 2.

### 5. Add product-only runtime copy regression coverage

## What to build

Add regression tests that feed provider-shaped adapter output into the React workbench and injected shell, then assert visible copy remains Michi product language.

## Acceptance criteria

- [ ] React visible shell tests reject provider route IDs, provider URLs, and provider product names.
- [ ] Injected shell visible copy tests reject provider route IDs, provider URLs, and provider product names.
- [ ] Playwright smoke verifies no provider-specific visible copy on desktop and mobile.
- [ ] Completion evidence remains visible and provider-neutral.

## Blocked by

- Slices 2 and 3.

### 6. Confirm permission and publishing boundary

## What to build

Record the next permission boundary decision before adding providers or preparing store publication. This is a human-in-the-loop decision because it affects extension trust, review surface, and product scope.

## Acceptance criteria

- [ ] The design doc states whether the current provider-only manifest remains intentionally narrow.
- [ ] The design doc states what evidence is required before any broader host permissions.
- [ ] No code widens permissions in this slice.
- [ ] GitHub issue labels are confirmed before publishing AFK-ready tickets.

## Blocked by

None - can start immediately.

## Approval Questions

1. Is this granularity right, or should slices 1-3 be merged into one implementation issue?
2. Should slice 6 stay HITL, or should we defer permission strategy entirely until a later PRD?
3. Should GitHub use a new `ready-for-agent` label, or should Michi use the existing `enhancement` label for these issues?
