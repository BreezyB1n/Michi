import { describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createExtensionPermissionReport } from "./support/extensionPermissionGuard";

describe("extension permission guard", () => {
  const report = createExtensionPermissionReport();

  it("keeps the manifest Cloudflare-only and activeTab-only", () => {
    expect(report.manifest.manifest_version).toBe(3);
    expect(report.manifest.permissions).toEqual(["activeTab"]);
    expect(report.manifest.host_permissions ?? []).toEqual([]);
    expect(report.manifest.optional_permissions ?? []).toEqual([]);
    expect(report.manifest.optional_host_permissions ?? []).toEqual([]);
    expect(report.manifest.content_scripts).toEqual([
      {
        matches: ["https://dash.cloudflare.com/*"],
        js: ["content-script.js"],
        run_at: "document_idle"
      }
    ]);
  });

  it("keeps extension runtime source free of persistent, network, and scripting APIs", () => {
    expect(report.blockedApiReferences).toEqual([]);
  });

  it("scans the extension entry dependency graph and blocks forbidden API spellings", () => {
    const rootDir = mkdtempSync(path.join(tmpdir(), "michi-permission-guard-"));

    try {
      writeFileSync(
        path.join(rootDir, "manifest.json"),
        JSON.stringify({
          manifest_version: 3,
          permissions: ["activeTab"],
          content_scripts: [
            {
              matches: ["https://dash.cloudflare.com/*"],
              js: ["content-script.js"],
              run_at: "document_idle"
            }
          ]
        })
      );
      writeFileSync(
        path.join(rootDir, "contentScript.ts"),
        `
          import { blockedApis } from "./shared/network";
          void import("./shared/dynamic");
          const safeText = "fetch in text should not count";
          const safeRegex = /fetch in regex should not count/;
          console.info(safeText, safeRegex, blockedApis);
        `
      );
      mkdirSync(path.join(rootDir, "shared"));
      writeFileSync(
        path.join(rootDir, "shared", "network.ts"),
        `
          export const blockedApis = () => {
            const directFetch = fetch;
            void window.fetch("/api");
            void globalThis.fetch("/api");
            void self.fetch("/api");
            void navigator.sendBeacon("/api", "");
            void new XMLHttpRequest();
            void chrome.storage;
            void chrome["scripting"];
            const { storage } = chrome;
            return directFetch;
          };
        `
      );
      writeFileSync(
        path.join(rootDir, "shared", "dynamic.ts"),
        `
          export const dynamicBlocked = () => chrome.scripting;
        `
      );

      const fixtureReport = createExtensionPermissionReport({
        rootDir,
        manifestPath: "manifest.json",
        entryFiles: ["contentScript.ts"]
      });

      expect(fixtureReport.scannedFiles).toEqual([
        "contentScript.ts",
        "shared/network.ts",
        "shared/dynamic.ts"
      ]);
      expect(fixtureReport.blockedApiReferences.map((reference) => reference.api)).toEqual([
        "fetch",
        "fetch",
        "fetch",
        "fetch",
        "navigator.sendBeacon",
        "XMLHttpRequest",
        "chrome.storage",
        "chrome.scripting",
        "chrome.storage",
        "chrome.scripting"
      ]);
      expect(fixtureReport.blockedApiReferences.map((reference) => reference.snippet).join("\n")).not.toContain(
        "safeText"
      );
    } finally {
      rmSync(rootDir, { recursive: true, force: true });
    }
  });
});
