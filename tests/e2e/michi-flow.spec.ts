import { expect, test } from "@playwright/test";

const sampleIntent = "I want to build a small service that other people can access.";

test("runs the Workers guide path with recovery and critical confirmations", async ({
  page
}) => {
  await page.goto("/");

  await expect(page.getByLabel("Michi plugin panel")).toHaveCount(0);
  await page.getByRole("button", { name: "Text guide" }).click();
  await expect(page.getByRole("heading", { name: "Michi" })).toBeVisible();
  await page.getByLabel("User intent").fill(sampleIntent);
  await page.getByRole("button", { name: "Start guide" }).click();
  await page.getByRole("button", { name: "Backend logic or API" }).click();

  await expect(page.getByLabel("Simulated host website")).toBeVisible();
  await expect(page.getByLabel("Michi plugin panel")).toBeVisible();
  await expect(page.getByText("Cloudflare Workers")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Find the Workers entry" })).toBeVisible();

  const panelBox = await page.getByLabel("Michi plugin panel").boundingBox();
  const hostBox = await page.getByLabel("Simulated host website").boundingBox();
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
  await expect(page.getByText(/Provider synced/)).toBeVisible();

  await page.getByRole("button", { name: "Advance guide" }).click();
  await page.getByRole("button", { name: "Advance guide" }).click();
  await expect(page.getByRole("heading", { name: "Confirm Create Worker" })).toBeVisible();
  await page.getByRole("button", { name: "Confirm action" }).click();

  await expect(page.getByRole("heading", { name: "Review the starter response" })).toBeVisible();
  await page.getByRole("button", { name: "Advance guide" }).click();
  await page.getByRole("button", { name: "Advance guide" }).click();
  await expect(page.getByRole("heading", { name: "Confirm Deploy Worker" })).toBeVisible();
  await page.getByRole("button", { name: "Confirm action" }).click();
  await page.getByRole("button", { name: "Advance guide" }).click();

  await expect(page.getByRole("heading", { name: "Worker URL verified" })).toBeVisible();
  await expect(page.getByText("Cloudflare DNS")).toBeVisible();
  await expect(page.getByText("Domain routing")).toBeVisible();
});

test("runs the Pages guide path with critical deploy confirmation", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Text guide" }).click();
  await page.getByLabel("User intent").fill("Publish a static website.");
  await page.getByRole("button", { name: "Start guide" }).click();
  await page.getByRole("button", { name: "Static website" }).click();

  await expect(page.getByText("Cloudflare Pages")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Find the Pages entry" })).toBeVisible();
  await expect(page.getByText("Create and deploy a Pages site")).toBeVisible();

  await page.getByRole("button", { name: "Simulate page drift" }).click();
  await expect(page.getByRole("heading", { name: "Page layout changed" })).toBeVisible();
  await page.getByRole("button", { name: "Recover and re-check" }).click();
  await expect(page.getByText(/Provider synced/)).toBeVisible();

  await page.getByRole("button", { name: "Advance guide" }).click();
  await expect(page.getByRole("heading", { name: "Create a Pages project" })).toBeVisible();
  await page.getByRole("button", { name: "Advance guide" }).click();
  await expect(page.getByRole("heading", { name: "Choose static assets" })).toBeVisible();
  await page.getByRole("button", { name: "Advance guide" }).click();
  await expect(page.getByRole("heading", { name: "Deploy the Pages project" })).toBeVisible();
  await page.getByRole("button", { name: "Advance guide" }).click();
  await expect(page.getByRole("heading", { name: "Confirm Deploy Pages project" })).toBeVisible();
  await page.getByRole("button", { name: "Confirm action" }).click();
  await expect(page.getByRole("heading", { name: "Verify the Pages URL" })).toBeVisible();
  await page.getByRole("button", { name: "Advance guide" }).click();

  await expect(page.getByRole("heading", { name: "Pages URL verified" })).toBeVisible();
  await expect(page.getByText("Pages URL returned HTTP 200")).toBeVisible();
  await expect(page.getByText("Cloudflare DNS")).toBeVisible();
  await expect(page.getByText("Domain routing")).toBeVisible();
});
