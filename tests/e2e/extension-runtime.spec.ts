import { expect, test } from "@playwright/test";
import { fulfillCloudflareDashboardRoute } from "../support/cloudflareDashboardFixture";
import {
  getRuntimeProbeUrl,
  hasExtensionBuild,
  launchExtensionRuntime,
  readPageContextFromActiveTab
} from "../support/extensionRuntimeHarness";

test("loads the unpacked extension and reads Cloudflare page context", async ({}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium",
    "Extension runtime smoke only runs in the desktop Chromium project."
  );
  test.skip(
    !hasExtensionBuild(),
    "Run npm run build:extension before the extension runtime smoke."
  );
  const context = await launchExtensionRuntime(testInfo);

  try {
    let serviceWorker = context.serviceWorkers()[0];
    if (!serviceWorker) {
      serviceWorker = await context.waitForEvent("serviceworker");
    }

    const page = await context.newPage();
    await page.route("https://dash.cloudflare.com/**", fulfillCloudflareDashboardRoute);

    await page.goto("https://dash.cloudflare.com/example-account/workers-and-pages");
    await expect(page.getByRole("button", { name: "Create Worker" })).toBeVisible();
    await expect(page.getByLabel("Michi rail")).toBeVisible();
    await expect(page.getByRole("button", { name: "Image" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Video" })).toHaveCount(0);

    await page.getByRole("button", { name: "Guide" }).click();
    await expect(page.getByLabel("Michi guide panel")).toBeVisible();
    await expect(page.getByText("User intent")).toBeVisible();
    await expect(page.getByRole("button", { name: "Start guide" })).toBeVisible();
    await page.getByRole("button", { name: "Start guide" }).click();
    await expect(page.getByText("What kind of service are you building?")).toBeVisible();
    await page.getByRole("button", { name: "Backend logic or API" }).click();
    await expect(page.getByText("Step 1 / 5")).toBeVisible();
    await expect(page.getByText("Find the Workers entry")).toBeVisible();

    await page.getByRole("button", { name: "Check page" }).click();
    await expect(page.getByText("cloudflare.workers.overview")).toBeVisible();
    await expect(page.getByText("Create Worker button")).toBeVisible();
    await expect(page.getByText("Cloudflare Workers")).toBeVisible();
    await expect(page.getByText("Step 2 / 5")).toBeVisible();
    await expect(page.getByText("Create a Worker")).toBeVisible();
    await expect(page.getByText("Choose Create Worker and keep the generated starter service.")).toBeVisible();
    await expect(page.getByText("A Worker draft exists and the editor or setup view is visible.")).toBeVisible();
    await expect(page.getByLabel("Highlighted target: Create Worker button")).toBeVisible();
    const highlightBeforeScroll = await page
      .getByLabel("Highlighted target: Create Worker button")
      .boundingBox();
    expect(highlightBeforeScroll?.y).toBeGreaterThan(300);
    await page.evaluate(() => window.scrollTo(0, 120));
    await expect
      .poll(async () => {
        const box = await page.getByLabel("Highlighted target: Create Worker button").boundingBox();
        return box?.y ?? Number.POSITIVE_INFINITY;
      }, { message: "Expected highlight to stay visible after window scroll." })
      .toBeLessThan((highlightBeforeScroll?.y ?? 0) - 80);
    await page.getByRole("button", { name: "Next step" }).click();
    await expect(page.getByText("Critical write action")).toBeVisible();
    await expect(page.getByText("Confirm Create Worker")).toBeVisible();
    await expect(page.getByText(/Creates a new Cloudflare Worker resource/)).toBeVisible();
    await page.getByRole("button", { name: "Confirm action" }).click();
    await expect(page.getByText("Step 3 / 5")).toBeVisible();
    await expect(page.getByText("Review the starter response")).toBeVisible();
    await page.getByRole("button", { name: "Previous" }).click();
    await expect(page.getByText("Step 2 / 5")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByLabel("Michi guide panel")).toHaveCount(0);
    await page.getByRole("button", { name: "Guide" }).click();
    await expect(page.getByText("cloudflare.workers.overview")).toBeVisible();

    const response = await readPageContextFromActiveTab(serviceWorker);

    expect(response).toEqual(
      expect.objectContaining({
        type: "MICHI_PAGE_CONTEXT",
        context: expect.objectContaining({
          routeId: "cloudflare.workers.overview",
          locationLabel: "Workers & Pages / Overview",
          targets: expect.arrayContaining([
            expect.objectContaining({
              id: "create-worker-button",
              text: "Create Worker"
            })
          ])
        })
      })
    );

    await page.goto("https://dash.cloudflare.com/example-account/workers/starter-editor");
    await expect(page.getByLabel("Michi rail")).toBeVisible();
    await page.getByRole("button", { name: "Guide" }).click();
    await page.getByRole("button", { name: "Check page" }).click();
    await expect(page.getByText("cloudflare.workers.starter-editor")).toBeVisible();
    await expect(page.getByText("Step 3 / 5")).toBeVisible();
    await expect(page.getByText("Review the starter response")).toBeVisible();
    await expect(page.getByText("Starter request handler")).toBeVisible();
    await expect(page.getByLabel("Highlighted target: Starter request handler")).toBeVisible();

    await page.goto("https://dash.cloudflare.com/example-account/workers/deploy-review");
    await expect(page.getByLabel("Michi rail")).toBeVisible();
    await page.getByRole("button", { name: "Guide" }).click();
    await page.getByRole("button", { name: "Check page" }).click();
    await expect(page.getByText("cloudflare.workers.deploy-review")).toBeVisible();
    await expect(page.getByText("Step 4 / 5")).toBeVisible();
    await expect(page.getByText("Deploy the Worker")).toBeVisible();
    await expect(page.getByText("Deploy button")).toBeVisible();
    await expect(page.getByLabel("Highlighted target: Deploy button")).toBeVisible();
    await page.getByRole("button", { name: "Next step" }).click();
    await expect(page.getByText("Critical write action")).toBeVisible();
    await expect(page.getByText("Confirm Deploy Worker")).toBeVisible();
    await expect(page.getByText(/Publishes the Worker to a reachable URL/)).toBeVisible();

    await page.goto("https://dash.cloudflare.com/example-account/workers/deploy-result");
    await expect(page.getByLabel("Michi rail")).toBeVisible();
    await page.getByRole("button", { name: "Guide" }).click();
    await page.getByRole("button", { name: "Check page" }).click();
    await expect(page.getByText("Step 5 / 5")).toBeVisible();
    await expect(page.getByText("Verify the Worker URL")).toBeVisible();
    await expect(page.getByText("Worker URL detected")).toBeVisible();
    await expect(page.getByLabel("Highlighted target: Worker URL")).toBeVisible();
    await page.getByRole("button", { name: "Complete guide" }).click();
    await expect(page.getByText("Primary path complete")).toBeVisible();
    await expect(page.getByText("Worker URL verified")).toBeVisible();
    await expect(page.getByText("Cloudflare DNS")).toBeVisible();
    await expect(page.locator("[aria-label='Michi rail']").getByRole("button", { name: "Reset guide" })).toHaveCount(0);
    await page.getByRole("button", { name: "Reset guide" }).click();
    await expect(page.getByText("User intent")).toBeVisible();
    await expect(page.getByRole("button", { name: "Start guide" })).toBeVisible();
    await expect(page.getByText("Primary path complete")).toHaveCount(0);
    await expect(page.getByText("Cloudflare DNS")).toHaveCount(0);
    await expect(page.getByLabel(/Highlighted target/)).toHaveCount(0);

    await page.goto("https://dash.cloudflare.com/example-account/pages");
    await expect(page.getByLabel("Michi rail")).toBeVisible();
    await page.getByRole("button", { name: "Guide" }).click();
    await expect(page.getByText("User intent")).toBeVisible();
    await page.getByRole("button", { name: "Start guide" }).click();
    await page.getByRole("button", { name: "Static website" }).click();
    await expect(page.getByText("Cloudflare Pages")).toBeVisible();
    await expect(page.getByText("Step 1 / 5")).toBeVisible();
    await expect(page.getByText("Find the Pages entry")).toBeVisible();
    await page.getByRole("button", { name: "Check page" }).click();
    await expect(page.getByText("cloudflare.pages.overview")).toBeVisible();
    await expect(page.getByText("Step 2 / 5")).toBeVisible();
    await expect(page.getByText("Create a Pages project")).toBeVisible();
    await expect(page.getByText("Create Pages project button")).toBeVisible();
    await expect(page.getByLabel("Highlighted target: Create Pages project button")).toBeVisible();

    await page.evaluate(() => {
      window.history.pushState({}, "", "/example-account/workers-and-pages");
      document.body.innerHTML = `
        <nav><a href="/workers-and-pages">Workers & Pages</a></nav>
        <main>
          <h1>Workers & Pages</h1>
          <button>Create Worker</button>
        </main>
      `;
    });
    await page.getByRole("button", { name: "Check page" }).click();
    await expect(page.getByText("Route mismatch")).toBeVisible();
    await expect(page.getByText(/active guide is Cloudflare Pages/)).toBeVisible();
    await expect(page.getByText(/current page belongs to Cloudflare Workers/)).toBeVisible();
    await expect(page.getByLabel("Highlighted target: Create Worker button")).toHaveCount(0);

    await page.evaluate(() => {
      window.history.pushState({}, "", "/example-account/pages/deploy-review");
      document.body.innerHTML = `
        <nav><a href="/workers-and-pages">Workers & Pages</a></nav>
        <main>
          <h1>Deploy Pages project</h1>
          <p>Review the Pages deployment before publishing.</p>
          <button>Deploy Pages project</button>
        </main>
      `;
    });
    await page.getByRole("button", { name: "Check page" }).click();
    await expect(page.getByText("Route mismatch")).toHaveCount(0);
    await expect(page.getByText("cloudflare.pages.deploy-review")).toBeVisible();
    await expect(page.getByText("Step 4 / 5")).toBeVisible();
    await expect(page.getByText("Deploy the Pages project", { exact: true })).toBeVisible();
    await expect(page.getByText("Deploy Pages button")).toBeVisible();
    await expect(page.getByLabel("Highlighted target: Deploy Pages button")).toBeVisible();
    await page.getByRole("button", { name: "Next step" }).click();
    await expect(page.getByText("Critical write action")).toBeVisible();
    await expect(page.getByText("Confirm Deploy Pages project")).toBeVisible();
    await expect(page.getByText(/Publishes the Pages project to a reachable URL/)).toBeVisible();

    await page.goto("https://dash.cloudflare.com/example-account/pages/deploy-result");
    await expect(page.getByLabel("Michi rail")).toBeVisible();
    await page.getByRole("button", { name: "Guide" }).click();
    await page.getByRole("button", { name: "Check page" }).click();
    await expect(page.getByText("Step 5 / 5")).toBeVisible();
    await expect(page.getByText("Verify the Pages URL")).toBeVisible();
    await expect(page.getByText("Pages URL detected")).toBeVisible();
    await expect(page.getByLabel("Highlighted target: Pages URL")).toBeVisible();
    await page.getByRole("button", { name: "Complete guide" }).click();
    await expect(page.getByText("Primary path complete")).toBeVisible();
    await expect(page.getByText("Pages URL verified")).toBeVisible();
    await expect(page.getByText("Cloudflare DNS")).toBeVisible();

    await page.goto("https://dash.cloudflare.com/example-account/workers-and-pages/nested-scroll");
    await expect(page.getByLabel("Michi rail")).toBeVisible();
    await page.getByRole("button", { name: "Guide" }).click();
    await page.getByRole("button", { name: "Check page" }).click();
    await expect(page.getByLabel("Highlighted target: Create Worker button")).toBeVisible();
    const highlightBeforeNestedScroll = await page
      .getByLabel("Highlighted target: Create Worker button")
      .boundingBox();
    expect(highlightBeforeNestedScroll?.y).toBeGreaterThan(300);
    await page.locator("[data-scroll-container]").evaluate((element) => {
      element.scrollTop = 120;
      element.dispatchEvent(new Event("scroll"));
    });
    await expect(page.getByLabel("Highlighted target: Create Worker button")).toBeVisible();
    await expect
      .poll(async () => {
        const box = await page.getByLabel("Highlighted target: Create Worker button").boundingBox();
        return box?.y ?? Number.POSITIVE_INFINITY;
      }, { message: "Expected highlight to stay visible after nested scroll." })
      .toBeLessThan((highlightBeforeNestedScroll?.y ?? 0) - 80);

    await page.goto("https://dash.cloudflare.com/example-account/workers-and-pages/missing-target");
    await expect(page.getByLabel("Michi rail")).toBeVisible();
    await page.getByRole("button", { name: "Guide" }).click();
    await page.getByRole("button", { name: "Check page" }).click();
    await expect(page.getByText("Target missing")).toBeVisible();
    await expect(page.getByText(/Create Worker button/)).toBeVisible();
    await expect(page.getByLabel("Highlighted target: Create Worker button")).toHaveCount(0);

    await page.goto("https://dash.cloudflare.com/example-account/analytics");
    await expect(page.getByLabel("Michi rail")).toBeVisible();
    await page.getByRole("button", { name: "Guide" }).click();
    await page.getByRole("button", { name: "Check page" }).click();
    const unsupportedPanel = page.getByLabel("Michi guide panel");
    await expect(page.getByText("Unsupported page")).toBeVisible();
    await expect(unsupportedPanel.getByText(/supported Cloudflare dashboard pages/)).toBeVisible();
    await expect(unsupportedPanel.getByText(/Workers & Pages/)).toBeVisible();
    await expect(page.getByText("Step 1 / 5")).toHaveCount(0);
    await expect(page.getByLabel(/Highlighted target/)).toHaveCount(0);

    const extensionId = new URL(serviceWorker.url()).host;
    const probePage = await context.newPage();
    await probePage.goto(getRuntimeProbeUrl(extensionId));
    await expect(probePage.getByRole("heading", { name: "Michi runtime probe" })).toBeVisible();
    const responseElement = probePage.locator("#response");
    await expect(responseElement).toHaveAttribute("data-ready", "true");
    const failureResponse = JSON.parse((await responseElement.textContent()) ?? "null");

    expect(failureResponse).toEqual(
      expect.objectContaining({
        type: "MICHI_PAGE_CONTEXT_ERROR",
        reason: expect.stringMatching(/receiving end|Could not establish connection|content script/i)
      })
    );
    await probePage.close();
  } finally {
    await context.close();
  }
});
