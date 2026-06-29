import { describe, expect, it } from "vitest";
import { createCloudflarePageContextAdapter } from "../src/extension/cloudflarePageContextAdapter";

const renderDocument = (html: string) => {
  document.body.innerHTML = html;
  return document;
};

describe("Cloudflare page context adapter", () => {
  it("reads supported page context through the page context adapter contract", () => {
    const adapter = createCloudflarePageContextAdapter(
      renderDocument(`
        <main>
          <h1>Workers & Pages</h1>
          <button>Create Worker</button>
        </main>
      `),
      {
        href: "https://dash.cloudflare.com/example-account/workers-and-pages",
        title: "Workers & Pages"
      }
    );

    const context = adapter.readCurrentContext();

    expect(adapter).toMatchObject({
      id: "cloudflare-dashboard",
      product: "supported-workspace"
    });
    expect(context).toMatchObject({
      routeId: "cloudflare.workers.overview",
      locationLabel: "Workers & Pages / Overview",
      targets: [expect.objectContaining({ id: "create-worker-button" })]
    });
  });
});
