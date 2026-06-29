import { afterEach, describe, expect, it, vi } from "vitest";
import { createExtensionPageContextProvider } from "../src/domain/extensionPageContextProvider";
import type { HostPageContext } from "../src/domain/types";

const providerBrandPattern = /\b(?:Cloudflare|Workers|Pages|DNS)\b|cloudflare\./i;

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
  afterEach(() => {
    vi.useRealTimers();
  });

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

    expect(context.product).toBe("michi");
    expect(context.routeId).toBe("michi.unsupported");
    expect(context.locationLabel).toBe("Unsupported page context");
    expect(context.signals[0]).toEqual(
      expect.objectContaining({
        severity: "error",
        value: expect.stringContaining("No receiving end")
      })
    );
  });

  it("maps missing extension runtime to controlled unsupported context", async () => {
    const provider = createExtensionPageContextProvider(undefined);

    const context = await provider.getCurrentContext();

    expect(context.product).toBe("michi");
    expect(context.routeId).toBe("michi.unsupported");
    expect(context.signals[0]).toEqual(
      expect.objectContaining({
        severity: "error",
        value: "Extension runtime is not available."
      })
    );
  });

  it("maps explicit extension error responses to controlled unsupported context", async () => {
    const provider = createExtensionPageContextProvider({
      sendMessage: vi.fn((_message, callback) => {
        callback({
          type: "MICHI_PAGE_CONTEXT_ERROR",
          reason: "Content script not ready"
        });
      })
    });

    const context = await provider.getCurrentContext();

    expect(context.product).toBe("michi");
    expect(context.routeId).toBe("michi.unsupported");
    expect(context.signals[0]).toEqual(
      expect.objectContaining({
        severity: "error",
        value: "Content script not ready"
      })
    );
  });

  it("maps invalid extension responses to controlled unsupported context", async () => {
    const provider = createExtensionPageContextProvider({
      sendMessage: vi.fn((_message, callback) => {
        callback({ type: "MICHI_UNKNOWN_RESPONSE" } as never);
      })
    });

    const context = await provider.getCurrentContext();

    expect(context.product).toBe("michi");
    expect(context.routeId).toBe("michi.unsupported");
    expect(context.signals[0]).toEqual(
      expect.objectContaining({
        severity: "error",
        value: "Extension returned no page context."
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

    expect(context.product).toBe("michi");
    expect(context.routeId).toBe("michi.unsupported");
    expect(context.signals[0]).toEqual(
      expect.objectContaining({
        severity: "error",
        value: "Extension context invalidated"
      })
    );
  });

  it("maps stalled extension messages to controlled unsupported context after timeout", async () => {
    vi.useFakeTimers();

    const provider = createExtensionPageContextProvider(
      {
        sendMessage: vi.fn(() => undefined)
      },
      { timeoutMs: 25 }
    );

    const contextPromise = provider.getCurrentContext();
    await vi.advanceTimersByTimeAsync(24);

    await expect(Promise.race([contextPromise, Promise.resolve("pending")])).resolves.toBe("pending");

    await vi.advanceTimersByTimeAsync(1);
    const context = await contextPromise;

    expect(context.product).toBe("michi");
    expect(context.routeId).toBe("michi.unsupported");
    expect(context.signals[0]).toEqual(
      expect.objectContaining({
        severity: "error",
        value: "Extension page context request timed out after 25ms."
      })
    );
  });

  it("ignores late extension callbacks after timeout resolves", async () => {
    vi.useFakeTimers();
    let responseCallback: ((response?: { type: "MICHI_PAGE_CONTEXT"; context: HostPageContext }) => void) | undefined;

    const provider = createExtensionPageContextProvider(
      {
        sendMessage: vi.fn((_message, callback) => {
          responseCallback = callback;
        })
      },
      { timeoutMs: 10 }
    );

    const contextPromise = provider.getCurrentContext();
    await vi.advanceTimersByTimeAsync(10);

    responseCallback?.({
      type: "MICHI_PAGE_CONTEXT",
      context: cloudflareContext
    });

    const context = await contextPromise;

    expect(context.product).toBe("michi");
    expect(context.routeId).toBe("michi.unsupported");
    expect(context.signals[0].value).toBe("Extension page context request timed out after 10ms.");
  });

  it("normalizes provider-branded failure reasons before returning runtime context", async () => {
    const provider = createExtensionPageContextProvider({
      sendMessage: vi.fn((_message, callback) => {
        callback({
          type: "MICHI_PAGE_CONTEXT_ERROR",
          reason:
            "Could not read Cloudflare dashboard tab. Open Workers & Pages and retry DNS setup."
        });
      })
    });

    const context = await provider.getCurrentContext();
    const visibleContextCopy = [
      context.product,
      context.routeId,
      context.locationLabel,
      context.signals[0].label,
      context.signals[0].value
    ].join(" ");

    expect(visibleContextCopy).not.toMatch(providerBrandPattern);
    expect(context.signals[0].value).toContain("supported browser tab");
    expect(context.signals[0].value).toContain("Build area");
    expect(context.signals[0].value).toContain("custom domain");
  });
});
