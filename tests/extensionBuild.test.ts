import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const manifestPath = resolve(process.cwd(), "extension/public/manifest.json");

describe("Extension build scaffold", () => {
  it("declares a narrow Manifest V3 extension runtime", () => {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

    expect(manifest.manifest_version).toBe(3);
    expect(manifest.action.default_title).toBe("Michi");
    expect(manifest.background.service_worker).toBe("service-worker.js");
    expect(manifest.content_scripts[0].matches).toEqual(["https://dash.cloudflare.com/*"]);
    expect(JSON.stringify(manifest)).not.toContain("<all_urls>");
    expect(JSON.stringify(manifest)).not.toMatch(/http:\/\//);
  });
});
