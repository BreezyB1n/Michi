import { describe, expect, it } from "vitest";
import {
  checkedContextFromReducer,
  chooseBackendApiFromReducer,
  chooseStaticSiteFromReducer,
  completeGuideFromReducer,
  confirmCriticalActionFromReducer,
  nextStepFromReducer,
  previousStepFromReducer,
  resetGuideFromReducer,
  startGuideFromReducer
} from "../src/extension/extensionGuideSessionBridge";
import type { HostPageContext, PageTarget } from "../src/domain/types";

const target = (overrides: Partial<PageTarget>): PageTarget => ({
  id: "fallback-target",
  label: "Fallback target",
  role: "content",
  text: "Fallback",
  confidence: "medium",
  ...overrides
});

const context = (overrides: Partial<HostPageContext> = {}): HostPageContext => ({
  url: "https://dash.cloudflare.com/example-account/workers-and-pages",
  title: "Workers & Pages",
  product: "cloudflare",
  locationLabel: "Workers & Pages / Overview",
  routeId: "cloudflare.workers.overview",
  detectedAt: "2026-06-25T00:00:00.000Z",
  targets: [
    target({
      id: "create-worker-button",
      label: "Create Worker button",
      role: "button",
      text: "Create Worker",
      confidence: "high"
    })
  ],
  signals: [
    {
      id: "cloudflare.workers.overview-detected",
      label: "Cloudflare route detected",
      value: "cloudflare.workers.overview detected with 1 target.",
      severity: "info"
    }
  ],
  ...overrides
});

describe("Extension guide session bridge", () => {
  it("starts the injected shell guide through the shared reducer", () => {
    const state = startGuideFromReducer({
      open: true,
      intent: " Build a JSON API for customers. ",
      phase: "intent"
    });

    expect(state).toEqual({
      open: true,
      intent: "Build a JSON API for customers.",
      phase: "clarify",
      activeStepIndex: undefined
    });
  });

  it("projects backend API choice from reducer output into shell guide state", () => {
    const state = chooseBackendApiFromReducer({
      open: true,
      intent: "Build a JSON API for customers.",
      phase: "clarify"
    });

    expect(state).toEqual({
      open: true,
      intent: "Build a JSON API for customers.",
      phase: "guide",
      activeStepIndex: 0,
      serviceKind: "backend-api"
    });
  });

  it("projects static-site choice from reducer output into shell Pages guide state", () => {
    const state = chooseStaticSiteFromReducer({
      open: true,
      intent: "Publish a static site.",
      phase: "clarify",
      activeStepIndex: 1
    });

    expect(state).toEqual({
      open: true,
      intent: "Publish a static site.",
      phase: "guide",
      activeStepIndex: 0,
      serviceKind: "static-site"
    });
  });

  it("does not project service choices outside clarification", () => {
    const state = {
      open: true,
      intent: "Build a JSON API for customers.",
      phase: "confirm" as const,
      activeStepIndex: 1
    };

    expect(chooseBackendApiFromReducer(state)).toBe(state);
    expect(chooseStaticSiteFromReducer(state)).toBe(state);
  });

  it("projects previous-step navigation through the shared reducer", () => {
    expect(
      previousStepFromReducer({
        open: true,
        intent: "Build a JSON API for customers.",
        phase: "guide",
        activeStepIndex: 2
      })
    ).toEqual({
      open: true,
      intent: "Build a JSON API for customers.",
      phase: "guide",
      activeStepIndex: 1,
      serviceKind: "backend-api"
    });
  });

  it("projects next-step navigation and critical confirmation through the shared reducer", () => {
    expect(
      nextStepFromReducer({
        open: true,
        intent: "Build a JSON API for customers.",
        phase: "guide",
        activeStepIndex: 0
      })
    ).toEqual({
      open: true,
      intent: "Build a JSON API for customers.",
      phase: "guide",
      activeStepIndex: 1,
      serviceKind: "backend-api"
    });

    expect(
      nextStepFromReducer({
        open: true,
        intent: "Build a JSON API for customers.",
        phase: "guide",
        activeStepIndex: 1
      })
    ).toEqual({
      open: true,
      intent: "Build a JSON API for customers.",
      phase: "confirm",
      activeStepIndex: 1,
      serviceKind: "backend-api"
    });
  });

  it("projects explicit critical-action confirmation through the shared reducer", () => {
    expect(
      confirmCriticalActionFromReducer({
        open: true,
        intent: "Build a JSON API for customers.",
        phase: "confirm",
        activeStepIndex: 1
      })
    ).toEqual({
      open: true,
      intent: "Build a JSON API for customers.",
      phase: "guide",
      activeStepIndex: 2,
      serviceKind: "backend-api"
    });
  });

  it("projects final completion through the shared reducer only after evidence gating passes", () => {
    const finalStepState = {
      open: true,
      intent: "Build a JSON API for customers.",
      phase: "guide" as const,
      activeStepIndex: 4
    };

    expect(completeGuideFromReducer(finalStepState, false)).toBe(finalStepState);
    expect(completeGuideFromReducer(finalStepState, true)).toEqual({
      open: true,
      intent: "Build a JSON API for customers.",
      phase: "complete",
      activeStepIndex: 4,
      serviceKind: "backend-api"
    });
  });

  it("projects checked supported page context through the shared reducer", () => {
    expect(
      checkedContextFromReducer(
        {
          open: true,
          intent: "Build a JSON API for customers.",
          phase: "intent"
        },
        context()
      )
    ).toEqual({
      open: true,
      intent: "Build a JSON API for customers.",
      phase: "guide",
      activeStepIndex: 1,
      serviceKind: "backend-api"
    });
  });

  it("projects checked Pages page context through the shared reducer", () => {
    expect(
      checkedContextFromReducer(
        {
          open: true,
          intent: "Publish a static site.",
          phase: "guide",
          serviceKind: "static-site",
          activeStepIndex: 0
        },
        context({
          url: "https://dash.cloudflare.com/example-account/pages",
          title: "Pages",
          locationLabel: "Pages / Overview",
          routeId: "cloudflare.pages.overview",
          targets: [
            target({
              id: "create-pages-button",
              label: "Create Pages project button",
              role: "button",
              text: "Create Pages project",
              confidence: "high"
            })
          ]
        })
      )
    ).toEqual({
      open: true,
      intent: "Publish a static site.",
      phase: "guide",
      activeStepIndex: 1,
      serviceKind: "static-site"
    });
  });

  it("does not re-anchor a pending critical confirmation to a later checked route", () => {
    expect(
      checkedContextFromReducer(
        {
          open: true,
          intent: "Build a JSON API for customers.",
          phase: "confirm",
          activeStepIndex: 1
        },
        context({
          url: "https://dash.cloudflare.com/example-account/workers/services/edit/michi-starter",
          title: "Worker editor",
          locationLabel: "Workers / Starter editor",
          routeId: "cloudflare.workers.starter-editor",
          targets: [
            target({
              id: "starter-handler",
              label: "Starter request handler",
              role: "content",
              text: "export default { fetch() {} }",
              confidence: "medium"
            })
          ],
          signals: [
            {
              id: "cloudflare.workers.starter-editor-detected",
              label: "Cloudflare route detected",
              value: "cloudflare.workers.starter-editor detected with 1 target.",
              severity: "info"
            }
          ]
        })
      )
    ).toEqual({
      open: true,
      intent: "Build a JSON API for customers.",
      phase: "confirm",
      activeStepIndex: 1,
      serviceKind: "backend-api"
    });
  });

  it("projects missing target during pending confirmation into recovery", () => {
    expect(
      checkedContextFromReducer(
        {
          open: true,
          intent: "Build a JSON API for customers.",
          phase: "confirm",
          activeStepIndex: 1
        },
        context({
          targets: [],
          signals: [
            {
              id: "cloudflare.workers.overview-detected",
              label: "Cloudflare route detected",
              value: "cloudflare.workers.overview detected with 0 targets.",
              severity: "warning"
            }
          ]
        })
      )
    ).toEqual({
      open: true,
      intent: "Build a JSON API for customers.",
      phase: "recovery",
      activeStepIndex: 1,
      serviceKind: "backend-api"
    });
  });

  it("projects missing expected targets into reducer recovery", () => {
    expect(
      checkedContextFromReducer(
        {
          open: true,
          intent: "Build a JSON API for customers.",
          phase: "guide",
          activeStepIndex: 1
        },
        context({
          targets: [],
          signals: [
            {
              id: "cloudflare.workers.overview-detected",
              label: "Cloudflare route detected",
              value: "cloudflare.workers.overview detected with 0 targets.",
              severity: "warning"
            }
          ]
        })
      )
    ).toEqual({
      open: true,
      intent: "Build a JSON API for customers.",
      phase: "recovery",
      activeStepIndex: 1,
      serviceKind: "backend-api"
    });
  });

  it("projects recovered page context back to guide", () => {
    expect(
      checkedContextFromReducer(
        {
          open: true,
          intent: "Build a JSON API for customers.",
          phase: "recovery",
          activeStepIndex: 1
        },
        context()
      )
    ).toEqual({
      open: true,
      intent: "Build a JSON API for customers.",
      phase: "guide",
      activeStepIndex: 1,
      serviceKind: "backend-api"
    });
  });

  it("projects unsupported checked context to recovery without stale active step", () => {
    expect(
      checkedContextFromReducer(
        {
          open: true,
          intent: "Build a JSON API for customers.",
          phase: "complete",
          activeStepIndex: 4
        },
        context({
          url: "https://dash.cloudflare.com/example-account/analytics",
          title: "Analytics",
          locationLabel: "Unsupported Cloudflare dashboard area",
          routeId: "cloudflare.unsupported",
          targets: [],
          signals: [
            {
              id: "unsupported-cloudflare-area",
              label: "Unsupported Cloudflare area",
              value: "This Cloudflare dashboard area is outside Michi's Workers guide path.",
              severity: "info"
            }
          ]
        })
      )
    ).toEqual({
      open: true,
      intent: "Build a JSON API for customers.",
      phase: "recovery",
      activeStepIndex: undefined,
      serviceKind: "backend-api"
    });
  });

  it("projects reset through the shared reducer while keeping the shell open", () => {
    expect(
      resetGuideFromReducer({
        open: true,
        intent: "Build a JSON API for customers.",
        phase: "complete",
        activeStepIndex: 4
      })
    ).toEqual({
      open: true,
      intent: "",
      phase: "intent",
      activeStepIndex: undefined
    });
  });
});
