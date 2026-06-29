import { describe, expect, it } from "vitest";
import { createCloudflarePageContextAdapter } from "../src/extension/cloudflarePageContextAdapter";
import { buildCloudflareDashboardFixture } from "./support/cloudflareDashboardFixture";

const fixtureDocument = (url: string) => {
  const fixture = buildCloudflareDashboardFixture(url);

  document.documentElement.innerHTML = fixture.body;
  return document;
};

describe("Cloudflare page context adapter", () => {
  it("reads Workers overview route and target through the fixture-backed adapter contract", async () => {
    const url = "https://dash.cloudflare.com/example-account/workers-and-pages";
    const adapter = createCloudflarePageContextAdapter(fixtureDocument(url), {
      href: url,
      title: "Workers & Pages"
    });

    const context = await Promise.resolve(adapter.readCurrentContext());

    expect(adapter).toMatchObject({
      id: "cloudflare-dashboard",
      product: "supported-workspace"
    });
    expect(context).toMatchObject({
      routeId: "cloudflare.workers.overview",
      locationLabel: "Workers & Pages / Overview"
    });
    expect(context.targets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "workers-pages-nav" }),
        expect.objectContaining({ id: "create-worker-button" })
      ])
    );
    expect(context.signals[0]).toEqual(
      expect.objectContaining({
        id: "cloudflare.workers.overview-detected",
        severity: "info"
      })
    );
  });

  it("reads missing target fixture state without inventing adapter targets", async () => {
    const url = "https://dash.cloudflare.com/example-account/workers-and-pages/missing-target";
    const adapter = createCloudflarePageContextAdapter(fixtureDocument(url), {
      href: url,
      title: "Workers & Pages"
    });

    const context = await Promise.resolve(adapter.readCurrentContext());

    expect(context.routeId).toBe("cloudflare.workers.overview");
    expect(context.targets).toHaveLength(0);
    expect(context.signals[0]).toEqual(
      expect.objectContaining({
        id: "cloudflare.workers.overview-detected",
        severity: "warning",
        value: "cloudflare.workers.overview detected with 0 targets."
      })
    );
  });

  it("reads deploy-result completion evidence from the fixture-backed adapter", async () => {
    const url = "https://dash.cloudflare.com/example-account/workers/deploy-result";
    const adapter = createCloudflarePageContextAdapter(fixtureDocument(url), {
      href: url,
      title: "Deployment complete"
    });

    const context = await Promise.resolve(adapter.readCurrentContext());

    expect(context.routeId).toBe("cloudflare.workers.deploy-result");
    expect(context.targets).toEqual([
      expect.objectContaining({
        id: "workers-pages-nav"
      }),
      expect.objectContaining({
        id: "worker-url",
        label: "Worker URL"
      })
    ]);
    expect(context.signals[0]).toEqual(
      expect.objectContaining({
        id: "worker-url-detected",
        severity: "success",
        value: "https://michi-starter.example.workers.dev is visible on the page."
      })
    );
  });

  it("reads unsupported fixture state as unsupported adapter context", async () => {
    const url = "https://dash.cloudflare.com/example-account/analytics";
    const adapter = createCloudflarePageContextAdapter(fixtureDocument(url), {
      href: url,
      title: "Analytics"
    });

    const context = await Promise.resolve(adapter.readCurrentContext());

    expect(context.routeId).toBe("cloudflare.unsupported");
    expect(context.locationLabel).toBe("Unsupported Cloudflare dashboard area");
    expect(context.targets).toHaveLength(0);
    expect(context.signals[0]).toEqual(
      expect.objectContaining({
        id: "unsupported-cloudflare-area",
        severity: "info"
      })
    );
  });
});
