import { describe, expect, it } from "vitest";
import { targetCalloutForTarget } from "../src/domain/targetCallout";
import type { PageTarget } from "../src/domain/types";

const target = (overrides: Partial<PageTarget> = {}): PageTarget => ({
  id: "create-worker-button",
  label: "Create Worker button",
  role: "button",
  text: "Create Worker",
  confidence: "high",
  boundingBox: { x: 760, y: 40, width: 96, height: 34 },
  ...overrides
});

describe("target callout", () => {
  it("builds product-language copy and a viewport-clamped fixed position", () => {
    const callout = targetCalloutForTarget(target(), {
      viewportWidth: 800,
      viewportHeight: 640
    });

    expect(callout).toMatchObject({
      title: "Create service button",
      detail: "Michi is checking this target for the active guide step.",
      ariaLabel: "Michi target callout: Create service button"
    });
    expect(callout?.style).toContain("left: 572px");
    expect(callout?.style).toContain("top: 84px");
    expect(callout?.style).toContain("width: 220px");
  });

  it("places the callout above the target when the lower edge would overflow", () => {
    const callout = targetCalloutForTarget(
      target({ boundingBox: { x: 32, y: 560, width: 144, height: 36 } }),
      { viewportWidth: 800, viewportHeight: 600 }
    );

    expect(callout?.style).toContain("left: 32px");
    expect(callout?.style).toContain("top: 478px");
  });

  it("omits callouts for targets without a bounding box", () => {
    expect(targetCalloutForTarget(target({ boundingBox: undefined }))).toBeUndefined();
  });
});
