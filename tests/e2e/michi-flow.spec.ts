import { expect, test } from "@playwright/test";

const sampleIntent = "I want to build a small service that other people can access.";

test("runs the Workers guide path with recovery and critical confirmations", async ({
  page
}) => {
  await page.goto("/");

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

  await page.getByRole("button", { name: "Simulate sign-in block" }).click();
  await expect(page.getByRole("heading", { name: "Not signed in" })).toBeVisible();
  await page.getByRole("button", { name: "Recover and re-check" }).click();
  await expect(page.getByText(/Signed in and ready/)).toBeVisible();

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
