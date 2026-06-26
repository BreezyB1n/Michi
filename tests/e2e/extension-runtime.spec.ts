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
      const isMissingTargetFixture = route.request().url().includes("/missing-target");

      await route.fulfill({
        contentType: "text/html",
        body: `
          <!doctype html>
          <html>
            <head><title>Workers & Pages</title></head>
            <body>
              ${isMissingTargetFixture ? "" : '<nav><a href="/workers-and-pages">Workers & Pages</a></nav>'}
              <main>
                <h1>Workers & Pages</h1>
                ${isMissingTargetFixture ? "<p>Loading actions...</p>" : "<button>Create Worker</button>"}
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
    await expect(page.getByText("No page check yet")).toBeVisible();
    await page.getByRole("button", { name: "Check page" }).click();
    await expect(page.getByText("cloudflare.workers.overview")).toBeVisible();
    await expect(page.getByText("Create Worker button")).toBeVisible();
    await expect(page.getByText("Cloudflare Workers")).toBeVisible();
    await expect(page.getByText("Create a Worker")).toBeVisible();
    await expect(page.getByText("Choose Create Worker and keep the generated starter service.")).toBeVisible();
    await expect(page.getByText("A Worker draft exists and the editor or setup view is visible.")).toBeVisible();
    await expect(page.getByLabel("Highlighted target: Create Worker button")).toBeVisible();
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

    await page.goto("https://dash.cloudflare.com/example-account/workers-and-pages/missing-target");
    await expect(page.getByLabel("Michi rail")).toBeVisible();
    await page.getByRole("button", { name: "Guide" }).click();
    await page.getByRole("button", { name: "Check page" }).click();
    await expect(page.getByText("Target missing")).toBeVisible();
    await expect(page.getByText(/Create Worker button/)).toBeVisible();
    await expect(page.getByLabel("Highlighted target: Create Worker button")).toHaveCount(0);
  } finally {
    await context.close();
  }
});
