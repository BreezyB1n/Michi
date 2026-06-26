import { describe, expect, it } from "vitest";
import {
  readCloudflarePageContext,
  textWithinLimit
} from "../src/extension/cloudflarePageReader";

const renderDocument = (html: string) => {
  document.body.innerHTML = html;
  return document;
};

describe("Cloudflare page reader", () => {
  it("detects dashboard home with the Workers navigation target", () => {
    const doc = renderDocument(`
      <main>
        <a href="/workers-and-pages">Workers & Pages</a>
        <button hidden>Create Worker</button>
      </main>
    `);

    const context = readCloudflarePageContext(doc, {
      href: "https://dash.cloudflare.com/example-account",
      title: "Cloudflare dashboard"
    });

    expect(context.routeId).toBe("cloudflare.dashboard.home");
    expect(context.locationLabel).toBe("Cloudflare dashboard / Home");
    expect(context.targets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "workers-pages-nav",
          role: "navigation",
          text: "Workers & Pages",
          confidence: "high"
        })
      ])
    );
    expect(context.targets.some((target) => target.id === "create-worker-button")).toBe(false);
  });

  it("detects Workers overview and bounds target text", () => {
    const longLabel = `Create Worker ${"x".repeat(240)}`;
    const doc = renderDocument(`
      <main>
        <h1>Workers & Pages</h1>
        <button>${longLabel}</button>
      </main>
    `);

    const context = readCloudflarePageContext(doc, {
      href: "https://dash.cloudflare.com/example-account/workers-and-pages",
      title: "Workers & Pages"
    });

    const target = context.targets.find((candidate) => candidate.id === "create-worker-button");

    expect(context.routeId).toBe("cloudflare.workers.overview");
    expect(target).toBeDefined();
    expect(target?.text.length).toBeLessThanOrEqual(120);
    expect(textWithinLimit(longLabel).length).toBeLessThanOrEqual(120);
  });

  it("detects Pages overview and setup targets", () => {
    const overview = readCloudflarePageContext(
      renderDocument(`
        <main>
          <h1>Pages projects</h1>
          <button>Create Pages project</button>
        </main>
      `),
      {
        href: "https://dash.cloudflare.com/example-account/pages",
        title: "Pages"
      }
    );

    expect(overview.routeId).toBe("cloudflare.pages.overview");
    expect(overview.locationLabel).toBe("Pages / Overview");
    expect(overview.targets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "create-pages-button",
          label: "Create Pages project button",
          role: "button"
        })
      ])
    );

    const staticAssets = readCloudflarePageContext(
      renderDocument(`
        <main>
          <h1>Create a Pages project</h1>
          <button>Static assets</button>
        </main>
      `),
      {
        href: "https://dash.cloudflare.com/example-account/pages/new/static-assets",
        title: "Create Pages project"
      }
    );

    expect(staticAssets.routeId).toBe("cloudflare.pages.static-assets");
    expect(staticAssets.targets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "static-assets-option",
          label: "Static assets option"
        })
      ])
    );
  });

  it("detects Pages deploy review and Pages URL success evidence", () => {
    const deployReview = readCloudflarePageContext(
      renderDocument(`
        <main>
          <h1>Deploy Pages project</h1>
          <button>Deploy Pages project</button>
        </main>
      `),
      {
        href: "https://dash.cloudflare.com/example-account/pages/deploy-review",
        title: "Deploy Pages project"
      }
    );

    expect(deployReview.routeId).toBe("cloudflare.pages.deploy-review");
    expect(deployReview.targets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "deploy-pages-button",
          label: "Deploy Pages button"
        })
      ])
    );

    const deployResult = readCloudflarePageContext(
      renderDocument(`
        <main>
          <h1>Deployment complete</h1>
          <a href="https://michi-static.pages.dev">https://michi-static.pages.dev</a>
        </main>
      `),
      {
        href: "https://dash.cloudflare.com/example-account/pages/deploy-result",
        title: "Deployment complete"
      }
    );

    expect(deployResult.routeId).toBe("cloudflare.pages.deploy-result");
    expect(deployResult.targets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "pages-url",
          label: "Pages URL"
        })
      ])
    );
    expect(deployResult.signals[0]).toEqual(
      expect.objectContaining({
        id: "pages-url-detected",
        severity: "success"
      })
    );
  });

  it("keeps Pages deploy review non-final even when a Pages URL is visible", () => {
    const context = readCloudflarePageContext(
      renderDocument(`
        <main>
          <h1>Deploy Pages project</h1>
          <a href="https://preview-michi.pages.dev">https://preview-michi.pages.dev</a>
          <button>Deploy Pages project</button>
        </main>
      `),
      {
        href: "https://dash.cloudflare.com/example-account/pages/deploy-review",
        title: "Deploy Pages project"
      }
    );

    expect(context.routeId).toBe("cloudflare.pages.deploy-review");
    expect(context.targets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "deploy-pages-button" }),
        expect.objectContaining({ id: "pages-url" })
      ])
    );
    expect(context.signals[0]).toEqual(
      expect.objectContaining({
        id: "cloudflare.pages.deploy-review-detected",
        severity: "info"
      })
    );
  });

  it("keeps Pages deploy result identity when the Pages URL has not loaded", () => {
    const context = readCloudflarePageContext(
      renderDocument(`
        <main>
          <h1>Deployment complete</h1>
          <p>The Pages URL is still loading.</p>
        </main>
      `),
      {
        href: "https://dash.cloudflare.com/example-account/pages/deploy-result",
        title: "Deployment complete"
      }
    );

    expect(context.routeId).toBe("cloudflare.pages.deploy-result");
    expect(context.targets.some((target) => target.id === "pages-url")).toBe(false);
    expect(context.signals[0]).toEqual(
      expect.objectContaining({
        id: "cloudflare.pages.deploy-result-detected",
        severity: "warning"
      })
    );
  });

  it("detects deploy result evidence and unsupported pages", () => {
    const deployResult = readCloudflarePageContext(
      renderDocument(`
        <main>
          <h1>Deployment complete</h1>
          <a href="https://michi-guide-demo.workers.dev">https://michi-guide-demo.workers.dev</a>
        </main>
      `),
      {
        href: "https://dash.cloudflare.com/example-account/workers/services/view/michi-guide-demo",
        title: "michi-guide-demo"
      }
    );

    expect(deployResult.routeId).toBe("cloudflare.workers.deploy-result");
    expect(deployResult.signals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "worker-url-detected",
          severity: "success"
        })
      ])
    );

    const unsupported = readCloudflarePageContext(
      renderDocument("<main><h1>Inbox</h1></main>"),
      {
        href: "https://example.com/inbox",
        title: "Inbox"
      }
    );

    expect(unsupported.routeId).toBe("cloudflare.unsupported");
    expect(unsupported.targets).toHaveLength(0);
    expect(unsupported.signals[0]).toEqual(
      expect.objectContaining({
        severity: "info",
        value: expect.stringMatching(/unsupported/i)
      })
    );
  });

  it("treats unsupported Cloudflare dashboard areas as unsupported context", () => {
    const context = readCloudflarePageContext(
      renderDocument(`
        <nav><a href="/workers-and-pages">Workers & Pages</a></nav>
        <main>
          <h1>Analytics</h1>
          <p>Traffic insights for this account.</p>
        </main>
      `),
      {
        href: "https://dash.cloudflare.com/example-account/analytics",
        title: "Analytics"
      }
    );

    expect(context.routeId).toBe("cloudflare.unsupported");
    expect(context.locationLabel).toBe("Unsupported Cloudflare dashboard area");
    expect(context.targets).toHaveLength(0);
    expect(context.signals[0]).toEqual(
      expect.objectContaining({
        id: "unsupported-cloudflare-area",
        label: "Unsupported Cloudflare area",
        severity: "info",
        value: expect.stringContaining("Workers & Pages")
      })
    );
  });
});
