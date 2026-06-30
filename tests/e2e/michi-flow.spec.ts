import { expect, test } from "@playwright/test";

const sampleIntent = "I want to build a small service that other people can access.";
const providerVisibleCopyPattern =
  /\b(?:Cloudflare|Workers|Worker|DNS|Pages|MVP|demo|page context|context status)\b|cloudflare\.|workers\.dev|pages\.dev|dash\.cloudflare|current app|simulat/i;

const expectProductOnlyPageCopy = async (page: import("@playwright/test").Page) => {
  const copy = await page.evaluate(() => {
    const accessibleCopy = Array.from(
      document.body.querySelectorAll("[aria-label], [title], [alt], [placeholder]")
    )
      .flatMap((element) =>
        ["aria-label", "title", "alt", "placeholder"].map((attribute) =>
          element.getAttribute(attribute)
        )
      )
      .filter(Boolean)
      .join(" ");

    return `${document.body.innerText} ${accessibleCopy}`;
  });

  expect(copy).not.toMatch(providerVisibleCopyPattern);
};

const expectNoHorizontalOverflow = async (page: import("@playwright/test").Page) => {
  const hasHorizontalOverflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth ||
      document.body.scrollWidth > document.body.clientWidth
  );

  expect(hasHorizontalOverflow).toBe(false);
};

test("runs the Workers guide path with recovery and critical confirmations", async ({
  page
}) => {
  await page.goto("/");

  await expect(page.getByLabel("Michi side panel")).toHaveCount(0);
  await page.getByRole("button", { name: "Guide" }).click();
  await expect(page.getByRole("heading", { name: "Michi" })).toBeVisible();
  await expect(page.getByLabel("User intent")).toBeFocused();
  await expect(page.getByLabel("Command handoff").getByText("Ready for an intent")).toBeVisible();
  await expect(page.getByLabel("Command handoff").getByRole("button", { name: "Start from intent" })).toBeVisible();
  await page.getByLabel("User intent").fill(sampleIntent);
  await page.getByRole("button", { name: "Start guide" }).click();
  await expect(page.getByLabel("Activity history").getByText("Intent captured")).toBeVisible();
  await page.getByRole("button", { name: "Backend logic or API" }).click();

  await expect(page.getByLabel("Current page preview")).toBeVisible();
  await expect(page.getByLabel("Michi side panel")).toBeVisible();
  await expect(page.getByText("Service runtime", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Find the build area" })).toBeVisible();
  await expect(page.getByLabel("Activity history").getByText("Service path selected")).toBeVisible();
  await expect(page.getByLabel("Activity history").getByText("Page check synced").first()).toBeVisible();
  await expect(page.getByLabel("Command handoff").getByText("Next step is ready")).toBeVisible();

  const panelBox = await page.getByLabel("Michi side panel").boundingBox();
  const hostBox = await page.getByLabel("Current page preview").boundingBox();
  const activityBox = await page.getByLabel("Activity history").boundingBox();
  const viewport = page.viewportSize();
  expect(panelBox?.width).toBeLessThanOrEqual(430);
  expect(activityBox?.width).toBeLessThanOrEqual(panelBox?.width ?? 0);
  if ((viewport?.width ?? 0) > 980) {
    expect(hostBox?.width).toBeGreaterThan(panelBox?.width ?? 0);
  } else {
    expect(panelBox?.height).toBeLessThanOrEqual((viewport?.height ?? 0) * 0.72);
  }
  await expectNoHorizontalOverflow(page);

  await page.keyboard.press("Escape");
  await expect(page.getByLabel("Michi side panel")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Guide" })).toBeFocused();
  await page.getByRole("button", { name: "Guide" }).click();
  await expect(page.getByRole("heading", { name: "Find the build area" })).toBeVisible();

  await page.getByRole("button", { name: "Show page drift" }).click();
  await expect(page.getByRole("heading", { name: "Expected control missing" })).toBeVisible();
  await expect(page.getByText(/Michi cannot safely anchor this step/)).toBeVisible();
  await expect(page.getByText(/choose Recover now/).first()).toBeVisible();
  await expect(page.getByLabel("Command handoff").getByText("Recovery is required")).toBeVisible();
  await expect(page.getByLabel("Command handoff").getByRole("button", { name: "Recover now" })).toBeVisible();
  await expect(page.getByLabel("Activity history").getByText("Check needs recovery")).toBeVisible();
  await expectProductOnlyPageCopy(page);
  await page.getByLabel("Guide actions").getByRole("button", { name: "Recover now" }).click();
  await expect(
    page.getByLabel("Michi side panel").getByRole("definition").filter({
      hasText: /^Page check synced$/
    })
  ).toBeVisible();
  await expect(page.getByLabel("Activity history").getByText("Recovery completed")).toBeVisible();

  await page.getByRole("button", { name: "Advance guide" }).click();
  await page.getByRole("button", { name: "Advance guide" }).click();
  await expect(page.getByRole("heading", { name: "Confirm Create service" })).toBeVisible();
  await expect(page.getByLabel("Command handoff").getByText("User confirmation needed")).toBeVisible();
  await expect(page.getByLabel("Command handoff").getByRole("button", { name: "Confirm now" })).toBeVisible();
  await expect(page.getByLabel("Activity history").getByText("Confirmation needed")).toBeVisible();
  await page.getByRole("button", { name: "Confirm action" }).click();
  await expect(page.getByLabel("Activity history").getByText("Action confirmed").first()).toBeVisible();

  await expect(page.getByRole("heading", { name: "Review the starter response" })).toBeVisible();
  await page.getByRole("button", { name: "Advance guide" }).click();
  await page.getByRole("button", { name: "Advance guide" }).click();
  await expect(page.getByRole("heading", { name: "Confirm Deploy service" })).toBeVisible();
  await page.getByRole("button", { name: "Confirm action" }).click();
  await page.getByRole("button", { name: "Advance guide" }).click();

  await expect(page.getByRole("heading", { name: "Service URL verified" })).toBeVisible();
  await expect(page.getByLabel("Command handoff").getByText("Primary path is complete")).toBeVisible();
  await expect(page.getByLabel("Activity history").getByText("Completion evidence passed")).toBeVisible();
  await expect(page.getByText("Custom domain", { exact: true })).toBeVisible();
  await expect(page.getByText("Routing follow-up", { exact: true })).toBeVisible();
  await expectProductOnlyPageCopy(page);

  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.getByLabel("User intent")).toBeFocused();
  await expect(page.getByLabel("Activity history").getByText("Session reset")).toBeVisible();
  await expect(page.getByLabel("Activity history").getByText("Intent captured")).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
});

test("runs the Pages guide path with critical deploy confirmation", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Guide" }).click();
  await page.getByLabel("User intent").fill("Publish a static website.");
  await page.getByRole("button", { name: "Start guide" }).click();
  await page.getByRole("button", { name: "Static website" }).click();

  await expect(page.getByText("Site publishing", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Find the build area" })).toBeVisible();
  await expect(page.getByText("Create and publish a site")).toBeVisible();
  await expect(page.getByLabel("Activity history").getByText("Site path selected")).toBeVisible();

  await page.getByRole("button", { name: "Show page drift" }).click();
  await expect(page.getByRole("heading", { name: "Expected control missing" })).toBeVisible();
  await expect(page.getByText(/Michi cannot safely anchor this step/)).toBeVisible();
  await expect(page.getByLabel("Activity history").getByText("Check needs recovery")).toBeVisible();
  await expectProductOnlyPageCopy(page);
  await page.getByLabel("Guide actions").getByRole("button", { name: "Recover now" }).click();
  await expect(
    page.getByLabel("Michi side panel").getByRole("definition").filter({
      hasText: /^Page check synced$/
    })
  ).toBeVisible();
  await expect(page.getByLabel("Activity history").getByText("Recovery completed")).toBeVisible();

  await page.getByRole("button", { name: "Advance guide" }).click();
  await expect(page.getByRole("heading", { name: "Create a site" })).toBeVisible();
  await page.getByRole("button", { name: "Advance guide" }).click();
  await expect(page.getByRole("heading", { name: "Choose static assets" })).toBeVisible();
  await page.getByRole("button", { name: "Advance guide" }).click();
  await expect(page.getByRole("heading", { name: "Deploy the site" })).toBeVisible();
  await page.getByRole("button", { name: "Advance guide" }).click();
  await expect(page.getByRole("heading", { name: "Confirm Deploy site" })).toBeVisible();
  await expect(page.getByLabel("Activity history").getByText("Confirmation needed")).toBeVisible();
  await page.getByRole("button", { name: "Confirm action" }).click();
  await expect(page.getByRole("heading", { name: "Verify the site URL" })).toBeVisible();
  await expect(page.getByLabel("Activity history").getByText("Action confirmed")).toBeVisible();
  await page.getByRole("button", { name: "Advance guide" }).click();

  await expect(page.getByRole("heading", { name: "Site URL verified" })).toBeVisible();
  await expect(page.getByLabel("Activity history").getByText("Completion evidence passed")).toBeVisible();
  await expect(page.getByText("site URL returned HTTP 200").first()).toBeVisible();
  await expect(page.getByText("Custom domain", { exact: true })).toBeVisible();
  await expect(page.getByText("Routing follow-up", { exact: true })).toBeVisible();
  await expectProductOnlyPageCopy(page);
  await expectNoHorizontalOverflow(page);
});
