import { describe, expect, it, vi } from "vitest";
import { createExtensionPageContextProvider } from "../src/domain/extensionPageContextProvider";
import type { HostPageContext } from "../src/domain/types";

const cloudflareContext: HostPageContext = {
  url: "https://dash.cloudflare.com/example-account/workers-and-pages",
  title: "Workers & Pages",
  product: "cloudflare",
  locationLabel: "Workers & Pages / Overview",
  routeId: "cloudflare.workers.overview",
  detectedAt: "2026-06-24T00:00:00.000Z",
  targets: [
    {
      id: "create-worker-button",
      label: "Create Worker button",
      role: "button",
      text: "Create Worker",
      confidence: "high"
    }
  ],
  signals: [
    {
      id: "create-worker-visible",
      label: "Create Worker visible",
      value: "Create Worker action detected.",
      severity: "info"
    }
  ]
};

describe("Extension page context provider", () => {
  it("maps successful extension messages to HostPageContext", async () => {
    const sendMessage = vi.fn((_message, callback) => {
      callback({
        type: "MICHI_PAGE_CONTEXT",
        context: cloudflareContext
      });
    });

    const provider = createExtensionPageContextProvider({
      sendMessage,
      lastError: undefined
    });

    await expect(provider.getCurrentContext()).resolves.toEqual(cloudflareContext);
    expect(sendMessage).toHaveBeenCalledWith(
      { type: "MICHI_GET_PAGE_CONTEXT" },
      expect.any(Function)
    );
  });

  it("maps extension messaging failures to controlled unsupported context", async () => {
    const provider = createExtensionPageContextProvider({
      sendMessage: vi.fn((_message, callback) => {
        callback(undefined);
      }),
      lastError: { message: "No receiving end" }
    });

    const context = await provider.getCurrentContext();

    expect(context.routeId).toBe("cloudflare.unsupported");
    expect(context.locationLabel).toBe("Unsupported page context");
    expect(context.signals[0]).toEqual(
      expect.objectContaining({
        severity: "error",
        value: expect.stringContaining("No receiving end")
      })
    );
  });

  it("maps synchronous runtime exceptions to controlled unsupported context", async () => {
    const provider = createExtensionPageContextProvider({
      sendMessage: vi.fn(() => {
        throw new Error("Extension context invalidated");
      })
    });

    const context = await provider.getCurrentContext();

    expect(context.routeId).toBe("cloudflare.unsupported");
    expect(context.signals[0]).toEqual(
      expect.objectContaining({
        severity: "error",
        value: "Extension context invalidated"
      })
    );
  });
});
