import { describe, expect, it } from "vitest";
import { blockingStates, workersGuideSteps } from "../src/domain/siteSkillPack";
import { recoveryGuidanceForState } from "../src/domain/recoveryGuidance";
import type { HostPageContext } from "../src/domain/types";

const checkedContext = (overrides: Partial<HostPageContext>): HostPageContext => ({
  url: "https://dash.example.test/current",
  title: "Current workspace",
  product: "cloudflare",
  locationLabel: "Workers & Pages / Overview",
  routeId: "cloudflare.workers.overview",
  detectedAt: "2026-06-30T00:00:00.000Z",
  targets: [
    {
      id: "create-worker-button",
      label: "Create Worker button",
      role: "button",
      text: "Create Worker",
      confidence: "high"
    }
  ],
  signals: [
    {
      id: "page-check",
      label: "Page check",
      value: "Page check synced.",
      severity: "info"
    }
  ],
  ...overrides
});

const visibleCopy = (guidance: ReturnType<typeof recoveryGuidanceForState>) =>
  `${guidance.title} ${guidance.reason} ${guidance.impact} ${guidance.action}`;

const expectProductOnlyGuidance = (copy: string) => {
  expect(copy).not.toMatch(/\b(?:Cloudflare|Workers|Worker|Pages|DNS)\b|cloudflare\.|workers\.dev|pages\.dev|dash\.cloudflare/i);
};

describe("recovery guidance", () => {
  it("turns unsupported checked pages into actionable product guidance", () => {
    const guidance = recoveryGuidanceForState({
      blockingState: blockingStates["page-drift"],
      context: checkedContext({
        routeId: "cloudflare.unsupported",
        locationLabel: "Unsupported Cloudflare dashboard area",
        targets: [],
        signals: [
          {
            id: "unsupported-cloudflare-area",
            label: "Unsupported Cloudflare area",
            value: "This Cloudflare dashboard area is outside the supported guide surface.",
            severity: "warning"
          }
        ]
      }),
      serviceKind: "backend-api",
      step: workersGuideSteps[1]
    });

    expect(guidance).toMatchObject({
      kind: "unsupported-page",
      title: "Unsupported page",
      action: "Open a supported workspace page, then choose Recover now."
    });
    expect(guidance.reason).toContain("outside the current guide surface");
    expect(guidance.impact).toContain("Normal guide progress is paused");
    expectProductOnlyGuidance(visibleCopy(guidance));
  });

  it("explains route mismatch without switching the active guide path", () => {
    const guidance = recoveryGuidanceForState({
      blockingState: blockingStates["page-drift"],
      context: checkedContext({
        routeId: "cloudflare.pages.overview",
        locationLabel: "Pages / Overview",
        targets: [
          {
            id: "create-pages-button",
            label: "Create Pages project button",
            role: "button",
            text: "Create Pages project",
            confidence: "high"
          }
        ]
      }),
      serviceKind: "backend-api",
      step: workersGuideSteps[1]
    });

    expect(guidance).toMatchObject({
      kind: "route-mismatch",
      title: "Wrong guide area",
      action: "Return to the Service runtime path, then choose Recover now."
    });
    expect(guidance.reason).toContain("active guide is Service runtime");
    expect(guidance.reason).toContain("checked page looks like Site publishing");
    expect(guidance.impact).toContain("Michi keeps the current guide selected");
    expectProductOnlyGuidance(visibleCopy(guidance));
  });

  it("separates missing target guidance from unsupported-page guidance", () => {
    const guidance = recoveryGuidanceForState({
      blockingState: blockingStates["page-drift"],
      context: checkedContext({
        routeId: "cloudflare.workers.overview",
        targets: [],
        signals: [
          {
            id: "missing-target",
            label: "Missing target",
            value: "Expected target is not visible.",
            severity: "warning"
          }
        ]
      }),
      serviceKind: "backend-api",
      step: workersGuideSteps[1]
    });

    expect(guidance).toMatchObject({
      kind: "target-missing",
      title: "Expected control missing",
      action: "Wait for the page to finish loading or return to the expected step, then choose Recover now."
    });
    expect(guidance.reason).toContain("Create service button");
    expect(guidance.impact).toContain("Michi cannot safely anchor this step");
    expectProductOnlyGuidance(visibleCopy(guidance));
  });

  it("makes runtime-read failures distinct from unsupported pages", () => {
    const guidance = recoveryGuidanceForState({
      blockingState: blockingStates["extension-runtime-unavailable"],
      context: checkedContext({
        product: "michi",
        routeId: "michi.unsupported",
        locationLabel: "Unsupported page check",
        targets: [],
        signals: [
          {
            id: "extension-context-unavailable",
            label: "Extension context unavailable",
            value: "No receiving end",
            severity: "error"
          }
        ]
      }),
      serviceKind: "backend-api",
      step: workersGuideSteps[1]
    });

    expect(guidance).toMatchObject({
      kind: "runtime-unavailable",
      title: "Page read unavailable",
      action: "Refresh the active page or reload Michi, then choose Recover now."
    });
    expect(guidance.reason).toContain("Michi could not read the active page");
    expect(guidance.impact).toContain("guide state is preserved");
    expectProductOnlyGuidance(visibleCopy(guidance));
  });
});
