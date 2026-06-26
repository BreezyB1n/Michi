import { describe, expect, it } from "vitest";
import {
  canCompleteWorkersGuide,
  checkedContextWorkersGuideState,
  confirmWorkersGuideActionState,
  nextWorkersGuideState,
  preferredTargetForContext,
  previousWorkersGuideState,
  workersGuideStepForRouteId,
  workersGuideStepIndexForRouteId
} from "../src/domain/workersGuideFlow";
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
  targets: [target({})],
  signals: [
    {
      id: "route-detected",
      label: "Cloudflare route detected",
      value: "cloudflare.workers.overview detected.",
      severity: "info"
    }
  ],
  ...overrides
});

describe("Workers guide flow helpers", () => {
  it("maps supported Cloudflare route IDs to Workers guide steps", () => {
    expect(workersGuideStepIndexForRouteId("cloudflare.workers.overview")).toBe(1);
    expect(workersGuideStepForRouteId("cloudflare.workers.overview")?.title).toBe(
      "Create a Worker"
    );
    expect(workersGuideStepIndexForRouteId("cloudflare.unsupported")).toBeUndefined();
  });

  it("selects the guide target expected for the detected route", () => {
    const selected = preferredTargetForContext(
      context({
        targets: [
          target({ id: "workers-pages-nav", label: "Workers & Pages sidebar item" }),
          target({
            id: "create-worker-button",
            label: "Create Worker button",
            role: "button",
            text: "Create Worker",
            confidence: "high"
          })
        ]
      })
    );

    expect(selected?.id).toBe("create-worker-button");
  });

  it("checks page context into the matching guide step state", () => {
    expect(
      checkedContextWorkersGuideState(context(), { phase: "confirm", activeStepIndex: 0 })
    ).toEqual({
      phase: "guide",
      activeStepIndex: 1
    });
  });

  it("enters confirmation before moving past a critical write step", () => {
    expect(nextWorkersGuideState({ phase: "guide", activeStepIndex: 1 })).toEqual({
      phase: "confirm",
      activeStepIndex: 1
    });
  });

  it("advances after explicit critical action confirmation", () => {
    expect(confirmWorkersGuideActionState({ phase: "confirm", activeStepIndex: 1 })).toEqual({
      phase: "guide",
      activeStepIndex: 2
    });
  });

  it("clamps previous-step navigation at the first guide step", () => {
    expect(previousWorkersGuideState({ phase: "guide", activeStepIndex: 0 })).toEqual({
      phase: "guide",
      activeStepIndex: 0
    });
    expect(previousWorkersGuideState({ phase: "guide" })).toEqual({ phase: "guide" });
  });

  it("only completes the Workers guide with Worker URL success evidence on the final step", () => {
    const deployResult = context({
      url: "https://dash.cloudflare.com/example-account/workers/services/view/michi-starter/deployments",
      title: "Deployment complete",
      locationLabel: "Workers / Deployment result",
      routeId: "cloudflare.workers.deploy-result",
      targets: [
        target({
          id: "worker-url",
          label: "Worker URL",
          role: "status",
          text: "https://michi-starter.example.workers.dev",
          confidence: "high"
        })
      ],
      signals: [
        {
          id: "worker-url-detected",
          label: "Worker URL detected",
          value: "Worker URL returned HTTP 200 with the starter response.",
          severity: "success"
        }
      ]
    });

    expect(canCompleteWorkersGuide(deployResult, 4)).toBe(true);
    expect(canCompleteWorkersGuide(deployResult, 3)).toBe(false);
    expect(
      canCompleteWorkersGuide(
        context({
          routeId: "cloudflare.workers.deploy-result",
          targets: deployResult.targets,
          signals: [{ ...deployResult.signals[0], severity: "info" }]
        }),
        4
      )
    ).toBe(false);
  });
});
