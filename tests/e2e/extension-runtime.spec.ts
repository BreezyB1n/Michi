import { chromium, expect, test } from "@playwright/test";
import { existsSync } from "node:fs";
import path from "node:path";

const extensionPath = path.resolve(process.cwd(), "dist-extension");

declare const chrome: {
  tabs: {
    query(queryInfo: { active: boolean; currentWindow: boolean }): Promise<Array<{ id?: number }>>;
    sendMessage(tabId: number, message: unknown): Promise<unknown>;
  };
};

test("loads the unpacked extension and reads Cloudflare page context", async ({}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium",
    "Extension runtime smoke only runs in the desktop Chromium project."
  );
  test.skip(
    !existsSync(path.join(extensionPath, "manifest.json")),
    "Run npm run build:extension before the extension runtime smoke."
  );

  const userDataDir = testInfo.outputPath("extension-user-data");
  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: "chromium",
    headless: true,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`
    ]
  });

  try {
    let serviceWorker = context.serviceWorkers()[0];
    if (!serviceWorker) {
      serviceWorker = await context.waitForEvent("serviceworker");
    }

    const page = await context.newPage();
    await page.route("https://dash.cloudflare.com/**", async (route) => {
      const requestUrl = route.request().url();
      const isMissingTargetFixture = requestUrl.includes("/missing-target");
      const isUnsupportedAreaFixture = requestUrl.includes("/analytics");
      const isStarterEditorFixture = requestUrl.includes("/starter-editor");
      const isDeployReviewFixture = requestUrl.includes("/deploy-review");
      const isDeployResultFixture = requestUrl.includes("/deploy-result");

      await route.fulfill({
        contentType: "text/html",
        body: `
          <!doctype html>
          <html>
            <head><title>Workers & Pages</title></head>
            <body>
              ${isMissingTargetFixture ? "" : '<nav><a href="/workers-and-pages">Workers & Pages</a></nav>'}
              <main>
                ${
                  isDeployResultFixture
                    ? `<h1>Deployment complete</h1>
                       <p>Your Worker is available at:</p>
                       <a href="https://michi-starter.example.workers.dev">https://michi-starter.example.workers.dev</a>`
                    : isDeployReviewFixture
                      ? `<h1>Deploy Worker</h1>
                         <p>Review the Worker deployment before publishing.</p>
                         <button>Deploy Worker</button>`
                      : isStarterEditorFixture
                        ? `<h1>Worker starter editor</h1>
                           <pre><code>export default { async fetch(request) { return new Response("Hello from Michi"); } }</code></pre>`
                      : isUnsupportedAreaFixture
                        ? `<h1>Analytics</h1>
                           <p>Traffic insights for this account.</p>`
                    : `<h1>Workers & Pages</h1>
                       ${isMissingTargetFixture ? "<p>Loading actions...</p>" : "<button>Create Worker</button>"}`
                }
              </main>
            </body>
          </html>
        `
      });
    });

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

    const response = await serviceWorker.evaluate(async () => {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (typeof activeTab.id !== "number") {
        throw new Error("No active tab found for extension runtime smoke.");
      }

      return await chrome.tabs.sendMessage(activeTab.id, {
        type: "MICHI_GET_PAGE_CONTEXT"
      });
    });

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
  } finally {
    await context.close();
  }
});
