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
      await route.fulfill({
        contentType: "text/html",
        body: `
          <!doctype html>
          <html>
            <head><title>Workers & Pages</title></head>
            <body>
              <nav><a href="/workers-and-pages">Workers & Pages</a></nav>
              <main>
                <h1>Workers & Pages</h1>
                <button>Create Worker</button>
              </main>
            </body>
          </html>
        `
      });
    });

    await page.goto("https://dash.cloudflare.com/example-account/workers-and-pages");
    await expect(page.getByRole("button", { name: "Create Worker" })).toBeVisible();

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
  } finally {
    await context.close();
  }
});
