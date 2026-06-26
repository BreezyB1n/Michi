import { beforeEach, describe, expect, it } from "vitest";
import {
  highlightStyleForTarget,
  mountMichiInjectedShell,
  recoveryGuidanceForContext
} from "../src/extension/injectedShell";
import type { HostPageContext, PageTarget } from "../src/domain/types";

const renderCloudflareFixture = () => {
  document.body.innerHTML = `
    <nav><a href="/workers-and-pages">Workers & Pages</a></nav>
    <main>
      <h1>Workers & Pages</h1>
      <button>Create Worker</button>
    </main>
  `;
};

const click = (element: Element | null) => {
  if (!element) {
    throw new Error("Expected element to exist before click.");
  }

  element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
};

const hostContext = (overrides: Partial<HostPageContext> = {}): HostPageContext => ({
  url: "https://dash.cloudflare.com/example-account/workers-and-pages",
  title: "Workers & Pages",
  product: "cloudflare",
  locationLabel: "Workers & Pages / Overview",
  routeId: "cloudflare.workers.overview",
  detectedAt: "2026-06-25T00:00:00.000Z",
  targets: [],
  signals: [
    {
      id: "cloudflare.workers.overview-detected",
      label: "Cloudflare route detected",
      value: "cloudflare.workers.overview detected with 0 targets.",
      severity: "warning"
    }
  ],
  ...overrides
});

describe("Injected Michi extension shell", () => {
  beforeEach(() => {
    document.getElementById("michi-extension-root")?.remove();
  });

  it("mounts once in Shadow DOM with guide and check controls", () => {
    renderCloudflareFixture();

    const first = mountMichiInjectedShell(document);
    const second = mountMichiInjectedShell(document);
    const shadow = first.shadowRoot;

    expect(first).toBe(second);
    expect(document.querySelectorAll("#michi-extension-root")).toHaveLength(1);
    expect(shadow).not.toBeNull();
    expect(shadow?.textContent).toContain("Guide");
    expect(shadow?.textContent).toContain("Check page");
    expect(shadow?.textContent).not.toMatch(/Image|Video/);
  });

  it("opens, checks page context, and minimizes", () => {
    renderCloudflareFixture();

    const root = mountMichiInjectedShell(document, {
      href: "https://dash.cloudflare.com/example-account/workers-and-pages",
      title: "Workers & Pages"
    });
    const shadow = root.shadowRoot;

    click(shadow?.querySelector("[data-action='guide']") ?? null);
    expect(shadow?.textContent).toContain("Michi guide");
    expect(shadow?.textContent).toContain("No page check yet");

    click(shadow?.querySelector("[data-action='check']") ?? null);
    expect(shadow?.textContent).toContain("cloudflare.workers.overview");
    expect(shadow?.textContent).toContain("Create Worker button");
    expect(shadow?.textContent).toContain("Cloudflare route detected");
    expect(shadow?.textContent).toContain("Cloudflare Workers");
    expect(shadow?.textContent).toContain("Step 2 / 5");
    expect(shadow?.textContent).toContain("Create a Worker");
    expect(shadow?.textContent).toContain("Choose Create Worker and keep the generated starter service.");
    expect(shadow?.textContent).toContain("A Worker draft exists and the editor or setup view is visible.");

    click(shadow?.querySelector("[data-action='minimize']") ?? null);
    expect(shadow?.querySelector("[data-panel]")).toBeNull();
  });

  it("navigates guide steps locally after checking the page", () => {
    renderCloudflareFixture();

    const root = mountMichiInjectedShell(document, {
      href: "https://dash.cloudflare.com/example-account/workers-and-pages",
      title: "Workers & Pages"
    });
    const shadow = root.shadowRoot;

    click(shadow?.querySelector("[data-action='check']") ?? null);
    expect(shadow?.textContent).toContain("Step 2 / 5");
    expect(shadow?.textContent).toContain("Create a Worker");

    click(shadow?.querySelector("[data-action='next-step']") ?? null);
    expect(shadow?.textContent).toContain("Step 3 / 5");
    expect(shadow?.textContent).toContain("Review the starter response");
    expect(shadow?.textContent).toContain("Read the starter handler and keep the default response for the demo.");

    click(shadow?.querySelector("[data-action='previous-step']") ?? null);
    expect(shadow?.textContent).toContain("Step 2 / 5");
    expect(shadow?.textContent).toContain("Create a Worker");
  });

  it("collapses with Escape without clearing checked context", () => {
    renderCloudflareFixture();

    const root = mountMichiInjectedShell(document, {
      href: "https://dash.cloudflare.com/example-account/workers-and-pages",
      title: "Workers & Pages"
    });
    const shadow = root.shadowRoot;

    click(shadow?.querySelector("[data-action='guide']") ?? null);
    click(shadow?.querySelector("[data-action='check']") ?? null);
    expect(shadow?.textContent).toContain("cloudflare.workers.overview");

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(shadow?.querySelector("[data-panel]")).toBeNull();

    click(shadow?.querySelector("[data-action='guide']") ?? null);
    expect(shadow?.textContent).toContain("cloudflare.workers.overview");
    expect(shadow?.textContent).toContain("Create Worker button");
  });

  it("creates target highlight styles only when a bounding box exists", () => {
    const target: PageTarget = {
      id: "create-worker-button",
      label: "Create Worker button",
      role: "button",
      text: "Create Worker",
      confidence: "high",
      boundingBox: { x: 10, y: 20, width: 120, height: 40 }
    };

    expect(highlightStyleForTarget(target)).toContain("left: 8px");
    expect(highlightStyleForTarget(target)).toContain("top: 18px");
    expect(highlightStyleForTarget({ ...target, boundingBox: undefined })).toBeUndefined();
  });

  it("describes how to recover when the expected route target is missing", () => {
    const guidance = recoveryGuidanceForContext(hostContext());

    expect(guidance?.title).toBe("Target missing");
    expect(guidance?.reason).toContain("Create Worker button");
    expect(guidance?.recoveryAction).toContain("Check page");
  });

  it("describes unsupported page contexts without rendering normal target copy", () => {
    const guidance = recoveryGuidanceForContext(
      hostContext({
        routeId: "cloudflare.unsupported",
        locationLabel: "Unsupported page context",
        signals: [
          {
            id: "unsupported-page",
            label: "Unsupported page",
            value: "Unsupported page: Michi only reads Cloudflare dashboard pages in this milestone.",
            severity: "info"
          }
        ]
      })
    );

    expect(guidance?.title).toBe("Unsupported page");
    expect(guidance?.recoveryAction).toContain("Cloudflare dashboard");
  });
});
