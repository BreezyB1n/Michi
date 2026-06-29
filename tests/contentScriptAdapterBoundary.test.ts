import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const contentScriptSource = () =>
  readFileSync(resolve(process.cwd(), "src/extension/contentScript.ts"), "utf8");

describe("content script page context boundary", () => {
  it("depends on the page context adapter boundary instead of the provider reader", () => {
    const source = contentScriptSource();

    expect(source).toContain("createCloudflarePageContextAdapter");
    expect(source).toContain("createPageContextProviderFromAdapter");
    expect(source).not.toMatch(/from\s+["']\.\/cloudflarePageReader["']/);
  });
});
