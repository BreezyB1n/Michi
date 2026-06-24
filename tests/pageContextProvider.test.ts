import { describe, expect, it, vi } from "vitest";
import {
  createCloudflareMockPageContextProvider,
  hostPageContextForStep,
  pageDriftContextForStep
} from "../src/domain/pageContextProvider";
import { workersGuideSteps } from "../src/domain/siteSkillPack";

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
});
