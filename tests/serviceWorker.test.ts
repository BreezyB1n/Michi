import { afterEach, describe, expect, it, vi } from "vitest";
import type { MichiRuntimeMessage } from "../src/extension/runtimeMessages";

type ServiceWorkerListener = (
  message: unknown,
  sender: unknown,
  sendResponse: (response: MichiRuntimeMessage) => void
) => boolean | void;

type RuntimeLastError = {
  message?: string;
};

describe("extension service worker", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("normalizes missing content script failures into a runtime error response", async () => {
    let listener: ServiceWorkerListener | undefined;
    const runtime = {
      lastError: undefined as RuntimeLastError | undefined,
      onMessage: {
        addListener: vi.fn((nextListener: ServiceWorkerListener) => {
          listener = nextListener;
        })
      }
    };
    const chromeMock = {
      runtime,
      tabs: {
        query: vi.fn(
          (
            _queryInfo: { active: boolean; currentWindow: boolean },
            callback: (tabs: Array<{ id?: number }>) => void
          ) => callback([{ id: 42 }])
        ),
        sendMessage: vi.fn(
          (
            _tabId: number,
            _message: MichiRuntimeMessage,
            callback: (response?: MichiRuntimeMessage) => void
          ) => {
            runtime.lastError = {
              message: "Could not establish connection. Receiving end does not exist."
            };
            callback();
          }
        )
      }
    };

    vi.stubGlobal("chrome", chromeMock);

    await import("../src/extension/serviceWorker");

    expect(listener).toBeDefined();

    const responses: MichiRuntimeMessage[] = [];
    const keepsChannelOpen = listener?.(
      { type: "MICHI_GET_PAGE_CONTEXT" },
      {},
      (response) => responses.push(response)
    );

    expect(keepsChannelOpen).toBe(true);
    expect(chromeMock.tabs.sendMessage).toHaveBeenCalledWith(
      42,
      { type: "MICHI_GET_PAGE_CONTEXT" },
      expect.any(Function)
    );
    expect(responses).toEqual([
      {
        type: "MICHI_PAGE_CONTEXT_ERROR",
        reason: "Could not establish connection. Receiving end does not exist."
      }
    ]);
  });
});
