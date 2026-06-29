# Product-Only UI Boundary Issue Breakdown

This is a `to-issues` draft for the product-only UI boundary PRD. GitHub issue publication is intentionally held because the repository does not currently have a confirmed `ready-for-agent` label strategy.

## Proposed Vertical Slices

1. **Record the product-only UI boundary**
   - **Type**: AFK
   - **Blocked by**: None
   - **User stories covered**: 1, 7, 10

2. **Guard visible React and injected shell copy**
   - **Type**: AFK
   - **Blocked by**: Slice 1
   - **User stories covered**: 1, 2, 3, 4, 5, 8

3. **Guard active status and current-facing docs**
   - **Type**: AFK
   - **Blocked by**: Slice 1
   - **User stories covered**: 7, 8

4. **Run browser proof for product-only UI copy**
   - **Type**: AFK
   - **Blocked by**: Slices 2 and 3
   - **User stories covered**: 1, 4, 6, 8

## Issue Drafts

### 1. Record the product-only UI boundary

## What to build

Write the PRD, decision doc, and active execution plan that define Michi's product-only UI boundary. The boundary should allow provider-specific adapters and fixtures, but disallow provider framing in visible product surfaces and current execution status.

## Acceptance criteria

- [ ] The PRD states the user-visible product boundary.
- [ ] The decision doc states why provider-specific implementation remains internal.
- [ ] The active execution plan includes an evidence ledger.
- [ ] Issue publication remains held until label strategy is confirmed.

## Blocked by

None - can start immediately.

### 2. Guard visible React and injected shell copy

## What to build

Add or strengthen regression tests that render Michi's React workbench and injected shell through representative guide states, then assert visible text and common accessibility attributes use Michi product language only.

## Acceptance criteria

- [ ] React shell product-copy checks cover guide, recovery, confirmation, and completion states.
- [ ] Injected shell product-copy checks cover guide, recovery, confirmation, and completion states.
- [ ] Provider names, provider route IDs, provider URLs, `demo`, `MVP`, `simulated`, and `current app` are rejected from visible copy.
- [ ] Completion evidence remains visible after sanitization.

## Blocked by

- Slice 1.

### 3. Guard active status and current-facing docs

## What to build

Add a source/documentation guard for current product-boundary docs and execution status. The guard should fail when current-facing docs frame Michi UI as a provider-specific product instead of a provider-neutral side panel.

## Acceptance criteria

- [ ] The execution status summary describes Michi product capabilities without provider-branded UI framing.
- [ ] Current design docs and active plan text preserve the provider-internal/product-visible boundary.
- [ ] Historical completed specs may keep provider details when they document old implementation milestones.
- [ ] The guard is narrow enough not to block adapter, fixture, or historical documentation text.

## Blocked by

- Slice 1.

### 4. Run browser proof for product-only UI copy

## What to build

Run the browser-visible flow for React and extension smoke after product-copy guards pass. Capture evidence that desktop and mobile surfaces remain readable, product-only, and overflow-free.

## Acceptance criteria

- [ ] Focused product-copy tests pass.
- [ ] Full unit/component suite passes.
- [ ] Production build passes.
- [ ] Playwright smoke passes.
- [ ] Browser proof verifies no provider-branded visible copy on desktop and mobile.
- [ ] Evidence is recorded in the active execution plan before commit.

## Blocked by

- Slices 2 and 3.
