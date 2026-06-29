import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = join(__dirname, "..");

const providerUiFramingPattern =
  /\b(?:Cloudflare|Workers|Worker|DNS|Pages|MVP|demo|page context|context status)\b|cloudflare\.|workers\.dev|pages\.dev|dash\.cloudflare|current app|simulat/i;

const visibleMarkdown = (path: string) =>
  readFileSync(path, "utf8")
    .replace(/`[^`]+`/g, "")
    .replace(/\[[^\]]+\]\([^)]+\)/g, "");

describe("product-only UI boundary", () => {
  it("keeps current execution status in Michi product language", () => {
    const statusCopy = visibleMarkdown(join(repoRoot, "docs/exec-plans/status.md"));

    expect(statusCopy).not.toMatch(providerUiFramingPattern);
  });

  it("keeps the active product-only plan from framing provider details as UI", () => {
    const activePlanCopy = visibleMarkdown(
      join(repoRoot, "docs/exec-plans/active/product-only-ui-boundary.md")
    );

    expect(activePlanCopy).not.toMatch(providerUiFramingPattern);
  });
});
