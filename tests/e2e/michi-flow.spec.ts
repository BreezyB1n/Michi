import { expect, test } from "@playwright/test";

const sampleIntent = "I want to build a small service that other people can access.";
const providerBrandPattern = /\b(?:Cloudflare|Workers|Pages|DNS)\b/;

test("runs the Workers guide path with recovery and critical confirmations", async ({
  page
}) => {
  await page.goto("/");

  await expect(page.getByLabel("Michi side panel")).toHaveCount(0);
  await page.getByRole("button", { name: "Guide" }).click();
  await expect(page.getByRole("heading", { name: "Michi" })).toBeVisible();
  await page.getByLabel("User intent").fill(sampleIntent);
  await page.getByRole("button", { name: "Start guide" }).click();
  await page.getByRole("button", { name: "Backend logic or API" }).click();

  await expect(page.getByLabel("Current page preview")).toBeVisible();
  await expect(page.getByLabel("Michi side panel")).toBeVisible();
  await expect(page.getByText("Service runtime", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Find the build area" })).toBeVisible();

  const panelBox = await page.getByLabel("Michi side panel").boundingBox();
  const hostBox = await page.getByLabel("Current page preview").boundingBox();
  const viewport = page.viewportSize();
  expect(panelBox?.width).toBeLessThanOrEqual(430);
  if ((viewport?.width ?? 0) > 980) {
    expect(hostBox?.width).toBeGreaterThan(panelBox?.width ?? 0);
  } else {
    expect(panelBox?.height).toBeLessThanOrEqual((viewport?.height ?? 0) * 0.72);
  }

  await page.getByRole("button", { name: "Simulate page drift" }).click();
  await expect(page.getByRole("heading", { name: "Page layout changed" })).toBeVisible();
  await page.getByRole("button", { name: "Recover and re-check" }).click();
  await expect(page.getByText("Page context synced", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Advance guide" }).click();
  await page.getByRole("button", { name: "Advance guide" }).click();
  await expect(page.getByRole("heading", { name: "Confirm Create service" })).toBeVisible();
  await page.getByRole("button", { name: "Confirm action" }).click();

  await expect(page.getByRole("heading", { name: "Review the starter response" })).toBeVisible();
  await page.getByRole("button", { name: "Advance guide" }).click();
  await page.getByRole("button", { name: "Advance guide" }).click();
  await expect(page.getByRole("heading", { name: "Confirm Deploy service" })).toBeVisible();
  await page.getByRole("button", { name: "Confirm action" }).click();
  await page.getByRole("button", { name: "Advance guide" }).click();

  await expect(page.getByRole("heading", { name: "Service URL verified" })).toBeVisible();
  await expect(page.getByText("Custom domain", { exact: true })).toBeVisible();
  await expect(page.getByText("Routing follow-up", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Michi side panel")).not.toContainText(providerBrandPattern);
  await expect(page.locator("body")).not.toContainText(providerBrandPattern);
});

test("runs the Pages guide path with critical deploy confirmation", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Guide" }).click();
  await page.getByLabel("User intent").fill("Publish a static website.");
  await page.getByRole("button", { name: "Start guide" }).click();
  await page.getByRole("button", { name: "Static website" }).click();

  await expect(page.getByText("Site publishing")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Find the build area" })).toBeVisible();
  await expect(page.getByText("Create and publish a site")).toBeVisible();

  await page.getByRole("button", { name: "Simulate page drift" }).click();
  await expect(page.getByRole("heading", { name: "Page layout changed" })).toBeVisible();
  await page.getByRole("button", { name: "Recover and re-check" }).click();
  await expect(page.getByText("Page context synced", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Advance guide" }).click();
  await expect(page.getByRole("heading", { name: "Create a site" })).toBeVisible();
  await page.getByRole("button", { name: "Advance guide" }).click();
  await expect(page.getByRole("heading", { name: "Choose static assets" })).toBeVisible();
  await page.getByRole("button", { name: "Advance guide" }).click();
  await expect(page.getByRole("heading", { name: "Deploy the site" })).toBeVisible();
  await page.getByRole("button", { name: "Advance guide" }).click();
  await expect(page.getByRole("heading", { name: "Confirm Deploy site" })).toBeVisible();
  await page.getByRole("button", { name: "Confirm action" }).click();
  await expect(page.getByRole("heading", { name: "Verify the site URL" })).toBeVisible();
  await page.getByRole("button", { name: "Advance guide" }).click();

  await expect(page.getByRole("heading", { name: "Site URL verified" })).toBeVisible();
  await expect(page.getByText("site URL returned HTTP 200")).toBeVisible();
  await expect(page.getByText("Custom domain", { exact: true })).toBeVisible();
  await expect(page.getByText("Routing follow-up", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Michi side panel")).not.toContainText(providerBrandPattern);
  await expect(page.locator("body")).not.toContainText(providerBrandPattern);
});
