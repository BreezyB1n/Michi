import { beforeEach, describe, expect, it } from "vitest";
import {
  highlightStyleForTarget,
  mountMichiInjectedShell
} from "../src/extension/injectedShell";
import type { PageTarget } from "../src/domain/types";

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

    click(shadow?.querySelector("[data-action='minimize']") ?? null);
    expect(shadow?.querySelector("[data-panel]")).toBeNull();
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
});
