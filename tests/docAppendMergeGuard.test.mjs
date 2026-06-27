import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

const appendOnlyDocs = [
  "docs/design-docs/index.md",
  "docs/product-specs/index.md",
  "docs/exec-plans/status.md"
];

const runGit = (cwd, args) => {
  execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 5000
  });
};

const writeAppendOnlyDocs = (cwd, entry) => {
  for (const file of appendOnlyDocs) {
    const absolutePath = path.join(cwd, file);
    writeFileSync(
      absolutePath,
      `# ${path.basename(file)}\n\n## Entries\n\n- baseline\n- ${entry}\n`
    );
  }
};

describe("append-only docs merge guard", () => {
  it("lets parallel milestone additions merge without conflict", () => {
    const repoPath = mkdtempSync(path.join(tmpdir(), "michi-doc-merge-"));

    try {
      for (const file of appendOnlyDocs) {
        mkdirSync(path.dirname(path.join(repoPath, file)), { recursive: true });
      }

      if (existsSync(".gitattributes")) {
        writeFileSync(path.join(repoPath, ".gitattributes"), readFileSync(".gitattributes"));
      }

      writeAppendOnlyDocs(repoPath, "base");
      runGit(repoPath, ["init", "-q", "-b", "main"]);
      runGit(repoPath, ["config", "user.email", "michi@example.test"]);
      runGit(repoPath, ["config", "user.name", "Michi Test"]);
      runGit(repoPath, ["add", "."]);
      runGit(repoPath, ["commit", "-qm", "base"]);

      runGit(repoPath, ["switch", "-qc", "feature-a"]);
      writeAppendOnlyDocs(repoPath, "feature-a");
      runGit(repoPath, ["commit", "-qam", "feature-a"]);

      runGit(repoPath, ["switch", "-q", "main"]);
      runGit(repoPath, ["switch", "-qc", "feature-b"]);
      writeAppendOnlyDocs(repoPath, "feature-b");
      runGit(repoPath, ["commit", "-qam", "feature-b"]);

      runGit(repoPath, ["switch", "-q", "feature-a"]);
      const mergeResult = spawnSync("git", ["merge", "--no-edit", "feature-b"], {
        cwd: repoPath,
        encoding: "utf8",
        timeout: 5000
      });

      expect(mergeResult.status, mergeResult.stderr).toBe(0);

      for (const file of appendOnlyDocs) {
        const content = readFileSync(path.join(repoPath, file), "utf8");
        expect(content).toContain("- feature-a");
        expect(content).toContain("- feature-b");
      }
    } finally {
      rmSync(repoPath, { recursive: true, force: true });
    }
  });
});
