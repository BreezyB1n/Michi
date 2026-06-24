# Michi Extension Shell and Page Anchoring Product Spec

## Summary

Michi's second milestone turns the local web UI prototype into an extension-shaped guide surface with a clear page anchoring contract.

The milestone should preserve the current Cloudflare Workers demo path, but change the architecture from directly simulated page state to a provider-driven model. Michi should feel like a lightweight browser assistant: collapsed by default, expandable when needed, aware of the current page, and able to explain when page drift blocks the next guide step.

## Goals

- Define the extension shell behavior for collapsed, expanded, and recovery states.
- Keep the host website visually primary; Michi should not dominate the page.
- Introduce a `HostPageContext` contract between the page-understanding layer and the Guide UI.
- Replace hard-coded page state reads in the UI with a mockable page context provider.
- Support page drift detection as a first-class Blocking State.
- Preserve explicit confirmation for Critical Write Actions.
- Keep the current Cloudflare Workers path runnable in the local demo.
- Prepare the codebase for a future browser extension without requiring live Cloudflare credentials.

## Non-Goals

- Do not release a production browser extension in this milestone.
- Do not publish to the Chrome Web Store.
- Do not perform live Cloudflare account writes.
- Do not introduce an LLM-backed runtime.
- Do not support arbitrary websites beyond the Cloudflare demo fixture.
- Do not add media tools such as image or video modes to the Michi rail.
- Do not use the Chrome Side Panel API as the primary guide surface yet; page anchoring needs a page-attached surface first.

## Product Principles

### The Host Page Stays Primary

Michi should behave like an assistant attached to the page, not like a second application replacing it. The collapsed state must occupy only a narrow rail or launcher. The expanded state should use a constrained panel with predictable width on desktop and a bottom drawer on small screens.

### Anchoring Beats Chat

The guide is useful because it can point to the user's current product context. Every active step should connect the instruction to page evidence: current location, target element, detected signal, or blocking state.

### Explain Before Acting

Michi must explain why a step matters before asking the user to perform it. Any Critical Write Action must still require explicit confirmation before the guide advances.

### Recover In Place

When the page changes unexpectedly, Michi should not reset the session. It should name what changed, explain why the guide cannot continue, and offer the smallest recovery action.

## Primary User Flow

1. User opens the local Michi demo.
2. Michi appears as a compact guide rail attached to the browser edge.
3. User expands Michi into the guide panel.
4. User enters the sample service intent or continues an existing guide session.
5. Michi asks the backend/API versus static-site clarification.
6. User chooses backend/API.
7. Michi maps the intent to Cloudflare Workers.
8. The page context provider reports the current simulated Cloudflare location.
9. Michi shows the active Guide Step and the anchored page target.
10. User advances normally until a page drift event is simulated.
11. Michi enters Recovery, explaining the detected drift and the required recovery action.
12. User recovers, the provider reports the expected page context, and the guide resumes.
13. Critical Write Actions still require explicit confirmation.
14. The guide reaches completion and recommends Cloudflare DNS as the follow-up route.

## Required Surfaces

### Collapsed Rail

The rail is Michi's default lightweight footprint.

It must show:

- Michi identity
- current phase indicator
- open or expand action
- check status affordance
- minimize or close affordance

It must not show unrelated tool modes.

### Expanded Guide Panel

The panel is the main guide surface.

It must show:

- User Intent
- selected Capability
- current phase
- Guide Step title
- Step Purpose
- Completion Check
- Critical Write Action confirmation when required
- Recovery Step when blocked
- final Follow-up Capability Route

### Page Anchor Area

The anchor area connects the guide to the host page.

It must show:

- current location label
- target element label
- evidence for the current completion check
- provider status
- blocking state when present

### Recovery State

Recovery must be explicit and local to the current step.

It must show:

- what changed
- why that blocks the current step
- what the user should do next
- whether the guide can continue after recovery

## Data Concepts

### Host Page Context

`HostPageContext` is the normalized page-understanding object consumed by the Guide UI and Guide Agent Core.

```ts
type HostPageContext = {
  url: string;
  title: string;
  product: "cloudflare";
  locationLabel: string;
  routeId: string;
  detectedAt: string;
  targets: PageTarget[];
  signals: PageSignal[];
  blockingState?: BlockingState;
};
```

### Page Target

`PageTarget` describes a page element or control that a Guide Step can anchor to.

```ts
type PageTarget = {
  id: string;
  label: string;
  role: "navigation" | "button" | "form" | "status" | "content";
  text: string;
  confidence: "high" | "medium" | "low";
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};
```

### Page Signal

`PageSignal` describes page evidence that can help satisfy a Completion Check or explain a Blocking State.

```ts
type PageSignal = {
  id: string;
  label: string;
  value: string;
  severity: "info" | "success" | "warning" | "error";
};
```

### Page Context Provider

The provider boundary lets the local demo use a mock provider while a future extension can provide live content-script data.

```ts
type PageContextProvider = {
  getCurrentContext(): Promise<HostPageContext>;
  subscribe(listener: (context: HostPageContext) => void): () => void;
};
```

## Functional Requirements

### Shell Behavior

- Michi starts in a compact shell state.
- The user can expand Michi without losing Guide Session state.
- The user can collapse Michi without resetting the active Guide Step.
- Desktop expanded width must stay constrained so the host page remains usable.
- Mobile expanded mode uses a bottom drawer pattern rather than a full-page replacement.

### Page Context

- The Guide UI consumes page state through `PageContextProvider`.
- The Cloudflare demo uses a deterministic mock provider.
- The provider can emit normal page context, satisfied completion evidence, and blocking context.
- Page drift is represented as `BlockingState["id"] === "page-drift"`.
- The Guide Core can resume after the provider reports a recovered context.

### Anchoring

- Each Guide Step may reference a `PageTarget`.
- If a target is found with high or medium confidence, Michi shows the target label and evidence.
- If the target is missing, Michi enters Recovery instead of advancing silently.
- Visual highlighting must not intercept normal host page interaction.

### Confirmation

- Critical Write Actions continue to require explicit user confirmation.
- Confirmation copy must include the action label and account impact.
- A confirmation step cannot be completed by page context alone.

### Persistence

- The active Guide Session should survive collapse and expand.
- Full browser refresh persistence is not required for this milestone.
- Session persistence should remain local-only.

## Acceptance Criteria

- The local demo starts with Michi in a compact shell state.
- Expanding the shell reveals the full Guide Panel without resetting intent or progress.
- The Cloudflare Workers guide path still reaches completion.
- The Guide UI receives page location, target, and evidence from a provider boundary.
- A simulated page drift event produces a Recovery Step.
- Recovering from page drift returns the user to the expected Guide Step.
- Critical Write Action confirmation still blocks advancement until confirmed.
- Desktop layout keeps the host page wider than the expanded Michi panel.
- Mobile layout has no horizontal overflow.
- The rail contains only guide-relevant controls.

## Test Requirements

### Unit Tests

- `HostPageContext` fixtures normalize to the expected route and targets.
- `PageContextProvider` mock can emit normal, satisfied, and page-drift contexts.
- Guide Core maps `page-drift` into a Recovery Step.
- Recovery can return the session to the Guide phase.

### Component Tests

- Collapsed rail renders before the expanded panel.
- Expanding the rail keeps the current session state.
- Page Anchor Area displays location, target, and evidence from provider data.
- Page drift recovery explains what changed, why it blocks progress, and how to proceed.
- Confirmation state still requires explicit confirmation.

### Playwright Smoke Test

- Open the local app.
- Expand Michi from the compact shell.
- Enter the sample intent.
- Choose backend/API.
- Progress through the Workers flow.
- Trigger page drift.
- Recover from page drift.
- Confirm a Critical Write Action.
- Reach completion with DNS follow-up visible.
- Verify there is no horizontal overflow on desktop or mobile.

## Implementation Boundary

The next implementation plan should be derived from this spec and should touch these areas:

- extension shell state and UI components
- page context provider interface
- Cloudflare mock provider fixture
- Guide Core page-drift handling
- component and Playwright tests

The implementation plan should not add live browser-extension packaging until the provider boundary and shell behavior are stable.
