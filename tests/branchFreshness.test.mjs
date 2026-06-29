import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { evaluateBranchFreshness, formatBranchFreshnessReport } from "../scripts/check-branch-freshness.mjs";

const scriptPath = path.resolve(process.cwd(), "scripts/check-branch-freshness.mjs");

const baseInput = {
  branchName: "codex/michi-next-slice",
  baseRef: "origin/main",
  ahead: 1,
  behind: 0,
  dirtyFiles: [],
  strictClean: false
};

describe("branch freshness checklist", () => {
  it("passes a clean feature branch that is ahead of the base and not behind", () => {
    const result = evaluateBranchFreshness(baseInput);

    expect(result.ok).toBe(true);
    expect(result.status).toBe("ready");
    expect(result.recommendedAction).toBe("Open or update the PR for this branch.");
    expect(result.failures).toEqual([]);
  });

  it("fails when the branch is behind origin/main", () => {
    const result = evaluateBranchFreshness({
      ...baseInput,
      ahead: 2,
      behind: 3
    });

    expect(result.ok).toBe(false);
    expect(result.status).toBe("behind-base");
    expect(result.failures).toContain("Branch is 3 commit(s) behind origin/main.");
    expect(result.recommendedAction).toBe("Sync this branch with origin/main before marking it PR-ready.");
  });

  it("fails when the branch has no unique commits", () => {
    const result = evaluateBranchFreshness({
      ...baseInput,
      ahead: 0,
      behind: 0
    });

    expect(result.ok).toBe(false);
    expect(result.status).toBe("no-unique-commits");
    expect(result.failures).toContain("Branch has no commits that are unique from origin/main.");
    expect(result.recommendedAction).toBe("Close or ignore the PR if the work is already merged or superseded.");
  });

  it("fails as superseded when the branch has no unique commits even after the base moved ahead", () => {
    const result = evaluateBranchFreshness({
      ...baseInput,
      ahead: 0,
      behind: 4
    });

    expect(result.ok).toBe(false);
    expect(result.status).toBe("no-unique-commits");
    expect(result.failures).toEqual(["Branch has no commits that are unique from origin/main."]);
    expect(result.recommendedAction).toBe("Close or ignore the PR if the work is already merged or superseded.");
  });

  it("fails when running on main", () => {
    const result = evaluateBranchFreshness({
      ...baseInput,
      branchName: "main"
    });

    expect(result.ok).toBe(false);
    expect(result.status).toBe("on-main");
    expect(result.failures).toContain("Current branch is main.");
    expect(result.recommendedAction).toBe("Create a codex/* feature branch before making frontend changes.");
  });

  it("warns about dirty files by default without failing the branch", () => {
    const result = evaluateBranchFreshness({
      ...baseInput,
      dirtyFiles: ["M src/App.tsx", "?? docs/spec.md"]
    });

    expect(result.ok).toBe(true);
    expect(result.status).toBe("ready");
    expect(result.warnings).toContain("Working tree has 2 changed file(s).");
  });

  it("fails dirty files in strict-clean mode", () => {
    const result = evaluateBranchFreshness({
      ...baseInput,
      dirtyFiles: ["M src/App.tsx"],
      strictClean: true
    });

    expect(result.ok).toBe(false);
    expect(result.status).toBe("dirty");
    expect(result.failures).toContain("Working tree has 1 changed file(s).");
    expect(result.recommendedAction).toBe("Commit, stash, or discard local changes before opening the PR.");
  });

  it("formats a concise CLI report", () => {
    const result = evaluateBranchFreshness(baseInput);
    const report = formatBranchFreshnessReport(result);

    expect(report).toContain("Branch: codex/michi-next-slice");
    expect(report).toContain("Base: origin/main");
    expect(report).toContain("Ahead: 1");
    expect(report).toContain("Behind: 0");
    expect(report).toContain("Status: ready");
    expect(report).toContain("Action: Open or update the PR for this branch.");
  });

  it("exits successfully for a ready branch and fails for blocked CLI states", () => {
    const rootDir = mkdtempSync(path.join(tmpdir(), "michi-branch-freshness-"));
    const gitConfigPath = path.join(rootDir, "gitconfig");
    writeFileSync(gitConfigPath, "");
    const gitEnv = {
      ...process.env,
      GIT_CONFIG_GLOBAL: gitConfigPath,
      GIT_CONFIG_NOSYSTEM: "1"
    };
    const run = (args, cwd = rootDir) =>
      spawnSync("git", args, {
        cwd,
        env: gitEnv,
        encoding: "utf8"
      });
    const runNode = (args) =>
      spawnSync(process.execPath, [scriptPath, ...args], {
        cwd: rootDir,
        env: gitEnv,
        encoding: "utf8"
      });

    try {
      expect(run(["init"]).status).toBe(0);
      expect(run(["config", "user.name", "Michi Test"]).status).toBe(0);
      expect(run(["config", "user.email", "michi@example.test"]).status).toBe(0);
      writeFileSync(path.join(rootDir, "README.md"), "base\n");
      expect(run(["add", "README.md"]).status).toBe(0);
      expect(run(["commit", "-m", "base"]).status).toBe(0);
      expect(run(["branch", "-M", "base"]).status).toBe(0);
      expect(run(["switch", "-c", "feature"]).status).toBe(0);
      writeFileSync(path.join(rootDir, "feature.txt"), "feature\n");
      expect(run(["add", "feature.txt"]).status).toBe(0);
      expect(run(["commit", "-m", "feature"]).status).toBe(0);

      const ready = runNode(["--base", "base"]);
      expect(ready.status).toBe(0);
      expect(ready.stdout).toContain("Status: ready");

      expect(run(["switch", "base"]).status).toBe(0);
      writeFileSync(path.join(rootDir, "base.txt"), "base moved\n");
      expect(run(["add", "base.txt"]).status).toBe(0);
      expect(run(["commit", "-m", "move base"]).status).toBe(0);
      expect(run(["switch", "feature"]).status).toBe(0);

      const behind = runNode(["--base=base"]);
      expect(behind.status).toBe(1);
      expect(behind.stdout).toContain("Status: behind-base");

      const help = runNode(["--help"]);
      expect(help.status).toBe(0);
      expect(help.stdout).toContain("Usage:");

      const unknownOption = runNode(["--unknown"]);
      expect(unknownOption.status).toBe(2);
      expect(unknownOption.stderr).toContain("Unknown option: --unknown");
    } finally {
      rmSync(rootDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    }
  });
});
