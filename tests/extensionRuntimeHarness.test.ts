import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildExtensionLaunchArgs,
  buildPageContextRequestMessage,
  buildRuntimeProbeAssets,
  getRuntimeProbeUrl,
  installRuntimeProbe,
  requestPageContextFromActiveTab
} from "./support/extensionRuntimeHarness";

describe("Extension runtime harness", () => {
  it("builds deterministic runtime probe assets", () => {
    const assets = buildRuntimeProbeAssets();

    expect(assets.html).toContain("<title>Michi runtime probe</title>");
    expect(assets.html).toContain('<script src="runtime-probe.js"></script>');
    expect(assets.script).toContain('chrome.runtime.sendMessage({ type: "MICHI_GET_PAGE_CONTEXT" })');
    expect(assets.script).toContain("MICHI_PROBE_RUNTIME_ERROR");
    expect(assets.script).toContain('responseElement.dataset.ready = "true"');
  });

  it("installs runtime probe assets into an extension directory", () => {
    const extensionDirectory = mkdtempSync(path.join(tmpdir(), "michi-extension-probe-"));

    try {
      installRuntimeProbe(extensionDirectory);

      const htmlPath = path.join(extensionDirectory, "runtime-probe.html");
      const scriptPath = path.join(extensionDirectory, "runtime-probe.js");

      expect(existsSync(htmlPath)).toBe(true);
      expect(existsSync(scriptPath)).toBe(true);
      expect(readFileSync(htmlPath, "utf8")).toContain("Michi runtime probe");
      expect(readFileSync(scriptPath, "utf8")).toContain("MICHI_GET_PAGE_CONTEXT");
    } finally {
      rmSync(extensionDirectory, { recursive: true, force: true });
    }
  });

  it("builds unpacked extension launch arguments and probe URLs", () => {
    expect(buildExtensionLaunchArgs("/tmp/michi-extension")).toEqual([
      "--disable-extensions-except=/tmp/michi-extension",
      "--load-extension=/tmp/michi-extension"
    ]);

    expect(getRuntimeProbeUrl("abc123")).toBe("chrome-extension://abc123/runtime-probe.html");
  });

  it("builds a deterministic page context request message", () => {
    expect(buildPageContextRequestMessage()).toEqual({
      type: "MICHI_GET_PAGE_CONTEXT"
    });
  });

  it("requests page context from the active tab", async () => {
    const sentMessages: Array<{ tabId: number; message: unknown }> = [];
    const originalChrome = Reflect.get(globalThis, "chrome");

    Reflect.set(globalThis, "chrome", {
      tabs: {
        query: async () => [{ id: 42 }],
        sendMessage: async (tabId: number, message: unknown) => {
          sentMessages.push({ tabId, message });

          return {
            type: "MICHI_PAGE_CONTEXT",
            context: {
              routeId: "cloudflare.workers.overview"
            }
          };
        }
      }
    });

    try {
      await expect(
        requestPageContextFromActiveTab(buildPageContextRequestMessage())
      ).resolves.toEqual({
        type: "MICHI_PAGE_CONTEXT",
        context: {
          routeId: "cloudflare.workers.overview"
        }
      });
      expect(sentMessages).toEqual([
        {
          tabId: 42,
          message: {
            type: "MICHI_GET_PAGE_CONTEXT"
          }
        }
      ]);
    } finally {
      if (typeof originalChrome === "undefined") {
        Reflect.deleteProperty(globalThis, "chrome");
      } else {
        Reflect.set(globalThis, "chrome", originalChrome);
      }
    }
  });

  it("throws a clear error when no active tab id is available", async () => {
    const originalChrome = Reflect.get(globalThis, "chrome");

    Reflect.set(globalThis, "chrome", {
      tabs: {
        query: async () => [{}],
        sendMessage: async () => {
          throw new Error("sendMessage should not run without an active tab id.");
        }
      }
    });

    try {
      await expect(
        requestPageContextFromActiveTab(buildPageContextRequestMessage())
      ).rejects.toThrow("No active tab found for extension runtime smoke.");
    } finally {
      if (typeof originalChrome === "undefined") {
        Reflect.deleteProperty(globalThis, "chrome");
      } else {
        Reflect.set(globalThis, "chrome", originalChrome);
      }
    }
  });

  it("throws a clear error when there is no active tab", async () => {
    const originalChrome = Reflect.get(globalThis, "chrome");

    Reflect.set(globalThis, "chrome", {
      tabs: {
        query: async () => [],
        sendMessage: async () => {
          throw new Error("sendMessage should not run without an active tab.");
        }
      }
    });

    try {
      await expect(
        requestPageContextFromActiveTab(buildPageContextRequestMessage())
      ).rejects.toThrow("No active tab found for extension runtime smoke.");
    } finally {
      if (typeof originalChrome === "undefined") {
        Reflect.deleteProperty(globalThis, "chrome");
      } else {
        Reflect.set(globalThis, "chrome", originalChrome);
      }
    }
  });
});
