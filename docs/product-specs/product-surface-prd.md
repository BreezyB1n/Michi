# Michi Product Surface PRD

## Problem Statement

Michi should be evaluated as a guide agent product, not as a helper for one external workspace. The current shell already rewrites visible copy into product language, but the information architecture still needs a stronger contract for the next frontend slices.

The product surface should answer four questions:

1. What is Michi trying to help the user do?
2. What should the user do next?
3. What did Michi check on the page?
4. What changed in the session history?

External workspace readers, route IDs, selector logic, and fixture names are implementation details. They can prove the runtime path, but they must not define Michi's visible UI.

## Solution

Define Michi's first-class UI regions around product-owned concepts:

- Intent and phase: the task Michi is guiding.
- Guide step: action, purpose, completion check, and critical confirmation.
- Page check: current page location, target, evidence, and recovery state.
- Action controls: check, continue, confirm, recover, minimize, and reset.
- Activity timeline: a compact session trail of choices, checks, confirmations, recovery, and completion evidence.

The next implementation slice should add the Activity timeline as the first new product-owned region. This gives users a durable explanation of what Michi did without adding provider-branded workflow UI.

## User Stories

1. As a user, I want Michi to show the task it is guiding, so that the side panel feels like my agent and not an external product manual.
2. As a user, I want the next action and completion check to stay visible, so that I can act without reading a long instruction page.
3. As a user, I want page checks to be described in product language, so that I understand whether Michi can proceed.
4. As a user, I want to see what changed after I check, confirm, recover, or complete a step, so that the guide feels accountable.
5. As a mobile user, I want the product surface to stay compact, so that the panel does not dominate the host page.
6. As a frontend engineer, I want a typed product event model, so that UI history can be tested independently from any adapter.
7. As a maintainer, I want current-facing docs to reject provider-framed UI language, so that new work does not drift back to a single external workspace story.

## Product Surface Contract

- The side panel title, badges, section labels, buttons, empty states, errors, and accessibility labels must use Michi product language.
- Host-workspace details may appear only after passing through the product presentation boundary.
- Fixture and adapter names may stay provider-specific inside implementation and historical proof docs.
- Active plans and current architecture docs must describe Michi's UI regions, not an external product path.
- The host page preview can stay as a neutral proof surface, but it is not Michi UI.

## Activity Timeline Requirements

- Record session events for start, path choice, page check, critical confirmation request, confirmation, recovery, completion evidence, and reset.
- Render the latest events in a compact section inside the expanded panel.
- Use short product labels and severity tones: `info`, `success`, `warning`, `error`.
- Keep deterministic event ordering in local state.
- Do not persist events beyond the current browser session in this milestone.
- Do not add analytics, backend storage, account writes, or new extension permissions.

## Testing Decisions

- Add unit tests for activity event creation and ordering.
- Add component tests for timeline updates after start, path choice, check, recovery, confirmation, completion, and reset.
- Keep product-copy guards around rendered text and accessibility attributes.
- Extend browser proof only after the UI timeline exists.
- Keep adapter and fixture tests separate from product surface tests.

## Out of Scope

- No new provider integration.
- No live write automation.
- No storage or analytics.
- No public listing workflow.
- No broad permission model.
- No full visual redesign in this slice.

## Success Criteria

- Current docs describe Michi as a product shell, not an external workspace helper.
- The next implementation plan has a clear product-owned UI region to build.
- The first timeline implementation can be tested without reading adapter internals.
- The visible UI remains compact and product-only on desktop and mobile.
