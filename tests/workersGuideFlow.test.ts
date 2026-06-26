import { describe, expect, it } from "vitest";
import {
  canCompleteGuide,
  canCompleteWorkersGuide,
  guideStepIndexForContext,
  preferredTargetForContext,
  preferredTargetForContextAndServiceKind,
  workersGuideStepForRouteId,
  workersGuideStepIndexForRouteId
} from "../src/domain/workersGuideFlow";
import type { ServiceKind } from "../src/domain/types";
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

const pagesDeployResultContext = (): HostPageContext =>
  context({
    url: "https://dash.cloudflare.com/example-account/pages/deploy-result",
    title: "Deployment complete",
    locationLabel: "Pages / Deployment result",
    routeId: "cloudflare.pages.deploy-result",
    targets: [
      target({
        id: "pages-url",
        label: "Pages URL",
        role: "status",
        text: "https://michi-static.pages.dev",
        confidence: "high"
      })
    ],
    signals: [
      {
        id: "pages-url-detected",
        label: "Pages URL detected",
        value: "Pages URL returned HTTP 200 with the starter website.",
        severity: "success"
      }
    ]
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

  it("maps Pages route IDs and target selection for static-site guides", () => {
    const serviceKind: ServiceKind = "static-site";
    const pagesContext = context({
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
    });

    expect(guideStepIndexForContext(pagesContext, serviceKind)).toBe(1);
    expect(preferredTargetForContextAndServiceKind(pagesContext, serviceKind)?.id).toBe(
      "create-pages-button"
    );
  });

  it("only completes the Pages guide with Pages URL success evidence on the final step", () => {
    expect(canCompleteGuide(pagesDeployResultContext(), 4, "static-site")).toBe(true);
    expect(canCompleteGuide(pagesDeployResultContext(), 3, "static-site")).toBe(false);
    expect(canCompleteGuide(pagesDeployResultContext(), 4, "backend-api")).toBe(false);
  });
});
