import { describe, expect, it } from "vitest";
import { buildCloudflareDashboardFixture } from "./support/cloudflareDashboardFixture";

describe("Cloudflare dashboard fixture", () => {
  it("renders the Workers overview target by default", () => {
    const fixture = buildCloudflareDashboardFixture("https://dash.cloudflare.com/example-account/workers-and-pages");

    expect(fixture.contentType).toBe("text/html");
    expect(fixture.body).toContain("<title>Workers & Pages</title>");
    expect(fixture.body).toContain("Workers & Pages</a>");
    expect(fixture.body).toContain("<button>Create Worker</button>");
  });

  it("renders missing-target state without the create-worker button", () => {
    const fixture = buildCloudflareDashboardFixture(
      "https://dash.cloudflare.com/example-account/workers-and-pages/missing-target"
    );
    const futurePathFixture = buildCloudflareDashboardFixture(
      "https://dash.cloudflare.com/example-account/pages/missing-target"
    );

    expect(fixture.body).not.toContain("Workers & Pages</a>");
    expect(fixture.body).not.toContain("<button>Create Worker</button>");
    expect(fixture.body).toContain("Loading actions...");
    expect(futurePathFixture.body).toContain("Loading actions...");
    expect(futurePathFixture.body).not.toContain("<button>Create Worker</button>");
  });

  it("renders Pages overview and deployment result targets", () => {
    const overview = buildCloudflareDashboardFixture("https://dash.cloudflare.com/example-account/pages");
    const result = buildCloudflareDashboardFixture("https://dash.cloudflare.com/example-account/pages/deploy-result");

    expect(overview.body).toContain("<h1>Pages projects</h1>");
    expect(overview.body).toContain("<button>Create Pages project</button>");
    expect(result.body).toContain("https://michi-static.pages.dev");
  });

  it("renders Worker deployment review and result targets", () => {
    const review = buildCloudflareDashboardFixture(
      "https://dash.cloudflare.com/example-account/workers/deploy-review"
    );
    const result = buildCloudflareDashboardFixture(
      "https://dash.cloudflare.com/example-account/workers/deploy-result"
    );

    expect(review.body).toContain("<button>Deploy Worker</button>");
    expect(result.body).toContain("https://michi-starter.example.workers.dev");
  });

  it("renders unsupported and nested-scroll variants", () => {
    const unsupported = buildCloudflareDashboardFixture("https://dash.cloudflare.com/example-account/analytics");
    const nestedScroll = buildCloudflareDashboardFixture(
      "https://dash.cloudflare.com/example-account/workers-and-pages/nested-scroll"
    );

    expect(unsupported.body).toContain("<h1>Analytics</h1>");
    expect(unsupported.body).toContain("Traffic insights for this account.");
    expect(nestedScroll.body).toContain("data-scroll-container");
    expect(nestedScroll.body).toContain("data-scroll-spacer");
  });
});
