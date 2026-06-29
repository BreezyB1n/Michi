#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const DEFAULT_BASE_REF = "origin/main";

const statusForFailures = (input, failures) => {
  if (input.branchName === "main") {
    return "on-main";
  }
  if (input.ahead === 0) {
    return "no-unique-commits";
  }
  if (input.behind > 0) {
    return "behind-base";
  }
  if (input.strictClean && input.dirtyFiles.length > 0) {
    return "dirty";
  }

  return failures.length > 0 ? "blocked" : "ready";
};

const actionForStatus = (status, baseRef) => {
  switch (status) {
    case "on-main":
      return "Create a codex/* feature branch before making frontend changes.";
    case "behind-base":
      return `Sync this branch with ${baseRef} before marking it PR-ready.`;
    case "no-unique-commits":
      return "Close or ignore the PR if the work is already merged or superseded.";
    case "dirty":
      return "Commit, stash, or discard local changes before opening the PR.";
    case "ready":
      return "Open or update the PR for this branch.";
    default:
      return "Resolve the reported branch freshness failures.";
  }
};

export const evaluateBranchFreshness = ({
  branchName,
  baseRef = DEFAULT_BASE_REF,
  ahead,
  behind,
  dirtyFiles = [],
  strictClean = false
}) => {
  const failures = [];
  const warnings = [];

  const isMainBranch = branchName === "main";

  if (isMainBranch) {
    failures.push("Current branch is main.");
  }

  if (!isMainBranch && ahead === 0) {
    failures.push(`Branch has no commits that are unique from ${baseRef}.`);
  } else if (behind > 0) {
    failures.push(`Branch is ${behind} commit(s) behind ${baseRef}.`);
  }

  if (dirtyFiles.length > 0) {
    const message = `Working tree has ${dirtyFiles.length} changed file(s).`;
    if (strictClean) {
      failures.push(message);
    } else {
      warnings.push(message);
    }
  }

  const status = statusForFailures({ branchName, ahead, behind, dirtyFiles, strictClean }, failures);

  return {
    ok: failures.length === 0,
    status,
    branchName,
    baseRef,
    ahead,
    behind,
    dirtyFileCount: dirtyFiles.length,
    strictClean,
    warnings,
    failures,
    recommendedAction: actionForStatus(status, baseRef)
  };
};

export const formatBranchFreshnessReport = (result) => {
  const lines = [
    "Michi branch freshness",
    `Branch: ${result.branchName}`,
    `Base: ${result.baseRef}`,
    `Ahead: ${result.ahead}`,
    `Behind: ${result.behind}`,
    `Dirty files: ${result.dirtyFileCount}`,
    `Strict clean: ${result.strictClean ? "yes" : "no"}`,
    `Status: ${result.status}`
  ];

  if (result.failures.length > 0) {
    lines.push("Failures:");
    result.failures.forEach((failure) => lines.push(`- ${failure}`));
  }

  if (result.warnings.length > 0) {
    lines.push("Warnings:");
    result.warnings.forEach((warning) => lines.push(`- ${warning}`));
  }

  lines.push(`Action: ${result.recommendedAction}`);

  return lines.join("\n");
};

const runGit = (args) => execFileSync("git", args, { encoding: "utf8" }).trim();

const parseArgs = (argv) => {
  const options = {
    baseRef: DEFAULT_BASE_REF,
    strictClean: false,
    help: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--strict-clean") {
      options.strictClean = true;
    } else if (arg === "--base") {
      options.baseRef = argv[index + 1] ?? "";
      index += 1;
    } else if (arg.startsWith("--base=")) {
      options.baseRef = arg.slice("--base=".length);
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  if (!options.baseRef) {
    throw new Error("--base requires a git ref");
  }

  return options;
};

const printHelp = () => {
  console.log(`Usage: node scripts/check-branch-freshness.mjs [--base origin/main] [--strict-clean]

Checks whether the current branch is fresh enough to mark PR-ready.`);
};

const collectGitState = (options) => {
  const branchName = runGit(["rev-parse", "--abbrev-ref", "HEAD"]);
  const remoteName = options.baseRef.includes("/") ? options.baseRef.split("/")[0] : undefined;

  if (remoteName) {
    runGit(["fetch", "--quiet", "--prune", remoteName]);
  }

  const [behindText, aheadText] = runGit(["rev-list", "--left-right", "--count", `${options.baseRef}...HEAD`])
    .split(/\s+/)
    .filter(Boolean);

  return {
    branchName,
    baseRef: options.baseRef,
    behind: Number.parseInt(behindText, 10),
    ahead: Number.parseInt(aheadText, 10),
    dirtyFiles: runGit(["status", "--porcelain"]).split("\n").filter(Boolean),
    strictClean: options.strictClean
  };
};

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);

if (isDirectRun) {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
      printHelp();
      process.exit(0);
    }

    const result = evaluateBranchFreshness(collectGitState(options));
    console.log(formatBranchFreshnessReport(result));
    process.exit(result.ok ? 0 : 1);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(2);
  }
}
