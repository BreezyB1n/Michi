import { chromium, expect, test } from "@playwright/test";
import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fulfillCloudflareDashboardRoute } from "../support/cloudflareDashboardFixture";

const extensionPath = path.resolve(process.cwd(), "dist-extension");

const installRuntimeProbe = () => {
  writeFileSync(
    path.join(extensionPath, "runtime-probe.html"),
    `
      <!doctype html>
      <html>
        <head><title>Michi runtime probe</title></head>
        <body>
          <main>
            <h1>Michi runtime probe</h1>
            <pre id="response">pending</pre>
          </main>
          <script src="runtime-probe.js"></script>
        </body>
      </html>
    `
  );
  writeFileSync(
    path.join(extensionPath, "runtime-probe.js"),
    `
      const responseElement = document.getElementById("response");
      chrome.runtime.sendMessage({ type: "MICHI_GET_PAGE_CONTEXT" })
        .then((response) => {
          responseElement.textContent = JSON.stringify(response);
          responseElement.dataset.ready = "true";
        })
        .catch((error) => {
          responseElement.textContent = JSON.stringify({
            type: "MICHI_PROBE_RUNTIME_ERROR",
            reason: error instanceof Error ? error.message : "Probe could not reach runtime."
          });
          responseElement.dataset.ready = "true";
        });
    `
  );
};

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
  installRuntimeProbe();

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
    await page.route("https://dash.cloudflare.com/**", fulfillCloudflareDashboardRoute);

    await page.goto("https://dash.cloudflare.com/example-account/workers-and-pages");
    await expect(page.getByRole("button", { name: "Create Worker" })).toBeVisible();
    await expect(page.getByLabel("Michi rail")).toBeVisible();
    await expect(page.getByRole("button", { name: "Image" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Video" })).toHaveCount(0);

    await page.getByRole("button", { name: "Guide" }).click();
    await expect(page.getByLabel("Michi side panel")).toBeVisible();
    await expect(page.getByText("User intent")).toBeVisible();
    await expect(page.getByRole("button", { name: "Start guide" })).toBeVisible();
    await page.getByRole("button", { name: "Start guide" }).click();
    await expect(page.getByText("What kind of service are you building?")).toBeVisible();
    await page.getByRole("button", { name: "Backend logic or API" }).click();
    await expect(page.getByText("Step 1 / 5")).toBeVisible();
    await expect(page.getByText("Find the build area")).toBeVisible();

    await page.getByRole("button", { name: "Check page" }).click();
    await expect(page.getByText("Service runtime overview")).toBeVisible();
    await expect(page.getByText("Create service button")).toBeVisible();
    await expect(page.getByText("Service runtime", { exact: true })).toBeVisible();
    await expect(page.getByText("Step 2 / 5")).toBeVisible();
    await expect(page.getByText("Create a service")).toBeVisible();
    await expect(page.getByText("Choose the create action and keep the generated starter service.")).toBeVisible();
    await expect(page.getByText("A service draft exists and the editor or setup view is visible.")).toBeVisible();
    await expect(page.getByLabel("Highlighted target: Create service button")).toBeVisible();
    const highlightBeforeScroll = await page
      .getByLabel("Highlighted target: Create service button")
      .boundingBox();
    expect(highlightBeforeScroll?.y).toBeGreaterThan(300);
    await page.evaluate(() => window.scrollTo(0, 120));
    await expect
      .poll(async () => {
        const box = await page.getByLabel("Highlighted target: Create service button").boundingBox();
        return box?.y ?? Number.POSITIVE_INFINITY;
      }, { message: "Expected highlight to stay visible after window scroll." })
      .toBeLessThan((highlightBeforeScroll?.y ?? 0) - 80);
    await page.getByRole("button", { name: "Next step" }).click();
    await expect(page.getByText("Critical write action")).toBeVisible();
    await expect(page.getByText("Confirm Create service")).toBeVisible();
    await expect(page.getByText(/Creates a new service resource/)).toBeVisible();
    await page.getByRole("button", { name: "Confirm action" }).click();
    await expect(page.getByText("Step 3 / 5")).toBeVisible();
    await expect(page.getByText("Review the starter response")).toBeVisible();
    await page.getByRole("button", { name: "Previous" }).click();
    await expect(page.getByText("Step 2 / 5")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByLabel("Michi side panel")).toHaveCount(0);
    await page.getByRole("button", { name: "Guide" }).click();
    await expect(page.getByText("Service runtime overview")).toBeVisible();

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
    await expect(page.getByText("Service editor", { exact: true })).toBeVisible();
    await expect(page.getByText("Step 3 / 5")).toBeVisible();
    await expect(page.getByText("Review the starter response")).toBeVisible();
    await expect(page.getByText("Starter response handler")).toBeVisible();
    await expect(page.getByLabel("Highlighted target: Starter response handler")).toBeVisible();

    await page.goto("https://dash.cloudflare.com/example-account/workers/deploy-review");
    await expect(page.getByLabel("Michi rail")).toBeVisible();
    await page.getByRole("button", { name: "Guide" }).click();
    await page.getByRole("button", { name: "Check page" }).click();
    await expect(page.getByText("Deployment review", { exact: true })).toBeVisible();
    await expect(page.getByText("Step 4 / 5")).toBeVisible();
    await expect(page.getByText("Deploy the service")).toBeVisible();
    await expect(page.getByText("Deploy service button")).toBeVisible();
    await expect(page.getByLabel("Highlighted target: Deploy service button")).toBeVisible();
    await page.getByRole("button", { name: "Next step" }).click();
    await expect(page.getByText("Critical write action")).toBeVisible();
    await expect(page.getByText("Confirm Deploy service")).toBeVisible();
    await expect(page.getByText(/Publishes the service to a reachable URL/)).toBeVisible();

    await page.goto("https://dash.cloudflare.com/example-account/workers/deploy-result");
    await expect(page.getByLabel("Michi rail")).toBeVisible();
    await page.getByRole("button", { name: "Guide" }).click();
    await page.getByRole("button", { name: "Check page" }).click();
    await expect(page.getByText("Step 5 / 5")).toBeVisible();
    await expect(page.getByText("Verify the service URL")).toBeVisible();
    await expect(page.getByText("service URL detected")).toBeVisible();
    await expect(page.getByLabel("Highlighted target: Service URL")).toBeVisible();
    await page.getByRole("button", { name: "Complete guide" }).click();
    await expect(page.getByText("Primary path complete")).toBeVisible();
    await expect(page.getByText("Service URL verified")).toBeVisible();
    await expect(page.getByText("Custom domain")).toBeVisible();
    await expect(page.locator("[aria-label='Michi rail']").getByRole("button", { name: "Reset guide" })).toHaveCount(0);
    await page.getByRole("button", { name: "Reset guide" }).click();
    await expect(page.getByText("User intent")).toBeVisible();
    await expect(page.getByRole("button", { name: "Start guide" })).toBeVisible();
    await expect(page.getByText("Primary path complete")).toHaveCount(0);
    await expect(page.getByText("Custom domain")).toHaveCount(0);
    await expect(page.getByLabel(/Highlighted target/)).toHaveCount(0);

    await page.goto("https://dash.cloudflare.com/example-account/pages");
    await expect(page.getByLabel("Michi rail")).toBeVisible();
    await page.getByRole("button", { name: "Guide" }).click();
    await expect(page.getByText("User intent")).toBeVisible();
    await page.getByRole("button", { name: "Start guide" }).click();
    await page.getByRole("button", { name: "Static website" }).click();
    await expect(page.getByText("Site publishing")).toBeVisible();
    await expect(page.getByText("Step 1 / 5")).toBeVisible();
    await expect(page.getByText("Find the build area")).toBeVisible();
    await page.getByRole("button", { name: "Check page" }).click();
    await expect(page.getByText("Site publishing overview")).toBeVisible();
    await expect(page.getByText("Step 2 / 5")).toBeVisible();
    await expect(page.getByText("Create a site")).toBeVisible();
    await expect(page.getByText("Create site button")).toBeVisible();
    await expect(page.getByLabel("Highlighted target: Create site button")).toBeVisible();

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
    await expect(page.getByText(/active guide is Site publishing/)).toBeVisible();
    await expect(page.getByText(/current page belongs to Service runtime/)).toBeVisible();
    await expect(page.getByLabel("Highlighted target: Create service button")).toHaveCount(0);

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
    await expect(page.getByText("Site deployment review")).toBeVisible();
    await expect(page.getByText("Step 4 / 5")).toBeVisible();
    await expect(page.getByText("Deploy the site", { exact: true })).toBeVisible();
    await expect(page.getByText("Deploy site button")).toBeVisible();
    await expect(page.getByLabel("Highlighted target: Deploy site button")).toBeVisible();
    await page.getByRole("button", { name: "Next step" }).click();
    await expect(page.getByText("Critical write action")).toBeVisible();
    await expect(page.getByText("Confirm Deploy site")).toBeVisible();
    await expect(page.getByText(/Publishes the site project to a reachable URL/)).toBeVisible();

    await page.goto("https://dash.cloudflare.com/example-account/pages/deploy-result");
    await expect(page.getByLabel("Michi rail")).toBeVisible();
    await page.getByRole("button", { name: "Guide" }).click();
    await page.getByRole("button", { name: "Check page" }).click();
    await expect(page.getByText("Step 5 / 5")).toBeVisible();
    await expect(page.getByText("Verify the site URL")).toBeVisible();
    await expect(page.getByText("site URL detected")).toBeVisible();
    await expect(page.getByLabel("Highlighted target: Site URL")).toBeVisible();
    await page.getByRole("button", { name: "Complete guide" }).click();
    await expect(page.getByText("Primary path complete")).toBeVisible();
    await expect(page.getByText("Site URL verified")).toBeVisible();
    await expect(page.getByText("Custom domain")).toBeVisible();

    await page.goto("https://dash.cloudflare.com/example-account/workers-and-pages/nested-scroll");
    await expect(page.getByLabel("Michi rail")).toBeVisible();
    await page.getByRole("button", { name: "Guide" }).click();
    await page.getByRole("button", { name: "Check page" }).click();
    await expect(page.getByLabel("Highlighted target: Create service button")).toBeVisible();
    const highlightBeforeNestedScroll = await page
      .getByLabel("Highlighted target: Create service button")
      .boundingBox();
    expect(highlightBeforeNestedScroll?.y).toBeGreaterThan(300);
    await page.locator("[data-scroll-container]").evaluate((element) => {
      element.scrollTop = 120;
      element.dispatchEvent(new Event("scroll"));
    });
    await expect(page.getByLabel("Highlighted target: Create service button")).toBeVisible();
    await expect
      .poll(async () => {
        const box = await page.getByLabel("Highlighted target: Create service button").boundingBox();
        return box?.y ?? Number.POSITIVE_INFINITY;
      }, { message: "Expected highlight to stay visible after nested scroll." })
      .toBeLessThan((highlightBeforeNestedScroll?.y ?? 0) - 80);

    await page.goto("https://dash.cloudflare.com/example-account/workers-and-pages/missing-target");
    await expect(page.getByLabel("Michi rail")).toBeVisible();
    await page.getByRole("button", { name: "Guide" }).click();
    await page.getByRole("button", { name: "Check page" }).click();
    await expect(page.getByText("Target missing")).toBeVisible();
    await expect(page.getByText(/Create service button/)).toBeVisible();
    await expect(page.getByLabel("Highlighted target: Create service button")).toHaveCount(0);

    await page.goto("https://dash.cloudflare.com/example-account/analytics");
    await expect(page.getByLabel("Michi rail")).toBeVisible();
    await page.getByRole("button", { name: "Guide" }).click();
    await page.getByRole("button", { name: "Check page" }).click();
    const unsupportedPanel = page.getByLabel("Michi side panel");
    await expect(unsupportedPanel.getByLabel("Unsupported page")).toBeVisible();
    await expect(unsupportedPanel.getByText(/supported product pages/)).toBeVisible();
    await expect(unsupportedPanel.getByText(/build area/)).toBeVisible();
    await expect(page.getByText("Step 1 / 5")).toHaveCount(0);
    await expect(page.getByLabel(/Highlighted target/)).toHaveCount(0);

    const extensionId = new URL(serviceWorker.url()).host;
    const probePage = await context.newPage();
    await probePage.goto(`chrome-extension://${extensionId}/runtime-probe.html`);
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
