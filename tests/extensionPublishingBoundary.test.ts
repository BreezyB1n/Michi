import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();
const manifestPath = resolve(repoRoot, "extension/public/manifest.json");
const packagePath = resolve(repoRoot, "package.json");
const decisionPath = resolve(
  repoRoot,
  "docs/design-docs/runtime-context-permission-publishing-boundary-decision.md"
);

const storeManifestFields = [
  "author",
  "chrome_settings_overrides",
  "externally_connectable",
  "homepage_url",
  "icons",
  "key",
  "minimum_chrome_version",
  "oauth2",
  "optional_host_permissions",
  "optional_permissions",
  "short_name",
  "update_url"
];

const releaseScriptPattern = /(publish|store|webstore|chrome-store|zip|pack|sign|upload)/i;

describe("extension publishing boundary", () => {
  it("keeps the extension manifest as a local validation runtime, not a store listing", () => {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

    expect(manifest.name).toBe("Michi");
    expect(manifest.description).toMatch(/Development runtime/i);
    expect(manifest.permissions).toEqual(["activeTab"]);
    expect(manifest.content_scripts[0].matches).toEqual(["https://dash.cloudflare.com/*"]);

    const presentStoreFields = storeManifestFields.filter((field) => field in manifest);

    expect(presentStoreFields).toEqual([]);
  });

  it("does not expose package scripts that imply store packaging or publication", () => {
    const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
    const releaseScripts = Object.entries(packageJson.scripts ?? {})
      .filter(([name]) => releaseScriptPattern.test(name))
      .map(([name]) => name);

    expect(packageJson.private).toBe(true);
    expect(releaseScripts).toEqual([]);
  });

  it("records the human-reviewed boundary before permissions or publication expand", () => {
    expect(existsSync(decisionPath)).toBe(true);

    const decision = readFileSync(decisionPath, "utf8");

    expect(decision).toContain("Current Decision");
    expect(decision).toContain("No store publishing");
    expect(decision).toContain("No broader host permissions");
    expect(decision).toContain("Required Evidence Before Expansion");
  });
});
