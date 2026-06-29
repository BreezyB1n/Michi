import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();
const sourceExtensions = new Set([".ts", ".tsx"]);

const sourceFilesIn = (directory: string): string[] =>
  readdirSync(directory).flatMap((entry) => {
    const entryPath = join(directory, entry);
    const stats = statSync(entryPath);

    if (stats.isDirectory()) {
      return sourceFilesIn(entryPath);
    }

    return sourceExtensions.has(entryPath.slice(entryPath.lastIndexOf("."))) ? [entryPath] : [];
  });

describe("runtime fixture boundary", () => {
  it("keeps demo fixture helpers out of product runtime modules", () => {
    const sourceFiles = sourceFilesIn(join(repoRoot, "src"));
    const offenders = sourceFiles
      .filter((file) => readFileSync(file, "utf8").includes("cloudflareDashboardFixture"))
      .map((file) => relative(repoRoot, file));

    expect(offenders).toEqual([]);
  });

  it("keeps Cloudflare fixture generation in test support", () => {
    const fixtureSource = readFileSync(
      join(repoRoot, "tests/support/cloudflareDashboardFixture.ts"),
      "utf8"
    );

    expect(fixtureSource).toContain("buildCloudflareDashboardFixture");
    expect(fixtureSource).toContain("fulfillCloudflareDashboardRoute");
  });
});
