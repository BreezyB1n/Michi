import { describe, expect, it, vi } from "vitest";
import {
  createCloudflareMockPageContextProvider,
  hostPageContextForStep,
  pageDriftContextForStep
} from "../src/domain/pageContextProvider";
import { pagesGuideSteps, workersGuideSteps } from "../src/domain/siteSkillPack";

describe("Cloudflare mock page context provider", () => {
  it("returns Cloudflare route, targets, and signals for every Workers step", () => {
    for (let index = 0; index < workersGuideSteps.length; index += 1) {
      const step = workersGuideSteps[index];
      const context = hostPageContextForStep(index);

      expect(context.product).toBe("cloudflare");
      expect(context.routeId).toBe(step.expectedRouteId);
      expect(context.targets.some((target) => target.id === step.targetId)).toBe(true);
      expect(context.signals.length).toBeGreaterThan(0);
    }
  });

  it("returns Cloudflare route, targets, and signals for every Pages step", () => {
    for (let index = 0; index < pagesGuideSteps.length; index += 1) {
      const step = pagesGuideSteps[index];
      const context = hostPageContextForStep(index, "static-site");

      expect(context.product).toBe("cloudflare");
      expect(context.routeId).toBe(step.expectedRouteId);
      expect(context.targets.some((target) => target.id === step.targetId)).toBe(true);
      expect(context.signals.length).toBeGreaterThan(0);
    }
  });

  it("can emit normal, satisfied, and page-drift contexts", async () => {
    const provider = createCloudflareMockPageContextProvider();
    const listener = vi.fn();
    const unsubscribe = provider.subscribe(listener);

    const stepContext = provider.setStepIndex(2);
    const current = await provider.getCurrentContext();
    const driftContext = provider.simulatePageDrift();

    expect(current.routeId).toBe(stepContext.routeId);
    expect(stepContext.signals.some((signal) => signal.severity === "success")).toBe(true);
    expect(driftContext.blockingState?.id).toBe("page-drift");
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    provider.recoverToStep(0);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("creates page drift context for the requested guide step", () => {
    const context = pageDriftContextForStep(1);

    expect(context.blockingState?.id).toBe("page-drift");
    expect(context.routeId).toBe("cloudflare.unexpected-page");
    expect(context.targets).toHaveLength(0);
  });

  it("keeps provider step sync service-specific after static-site selection", async () => {
    const provider = createCloudflareMockPageContextProvider();

    const pagesContext = provider.setStepIndex(1, "static-site");
    const driftContext = provider.simulatePageDrift();
    const recoveredContext = provider.recoverToStep(4);

    expect(pagesContext.routeId).toBe("cloudflare.pages.overview");
    expect(driftContext.signals[0]?.value).toContain("Create a Pages project");
    expect(recoveredContext.routeId).toBe("cloudflare.pages.deploy-result");
    expect(recoveredContext.targets.some((target) => target.id === "pages-url")).toBe(true);
    expect((await provider.getCurrentContext()).routeId).toBe("cloudflare.pages.deploy-result");
  });
});
