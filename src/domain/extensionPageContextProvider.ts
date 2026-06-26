import {
  isPageContextMessage,
  type MichiRuntimeMessage
} from "../extension/runtimeMessages";
import { extensionContextUnavailableSignalId } from "./pageContextSignals";
import type { HostPageContext, PageContextProvider } from "./types";

type RuntimeLastError = {
  message?: string;
};

export type ExtensionRuntimeLike = {
  sendMessage: (
    message: MichiRuntimeMessage,
    callback: (response?: MichiRuntimeMessage) => void
  ) => void;
  lastError?: RuntimeLastError;
};

declare const chrome:
  | {
      runtime?: ExtensionRuntimeLike;
    }
  | undefined;

export const unsupportedPageContext = (
  reason = "Michi extension page context is unavailable.",
  severity: "info" | "error" = "info"
): HostPageContext => ({
  url: "about:blank",
  title: "Unsupported page context",
  product: "cloudflare",
  locationLabel: "Unsupported page context",
  routeId: "cloudflare.unsupported",
  detectedAt: new Date().toISOString(),
  targets: [],
  signals: [
    {
      id: extensionContextUnavailableSignalId,
      label: "Extension context unavailable",
      value: reason,
      severity
    }
  ]
});

const getDefaultRuntime = (): ExtensionRuntimeLike | undefined =>
  typeof chrome !== "undefined" ? chrome.runtime : undefined;

export const createExtensionPageContextProvider = (
  runtime = getDefaultRuntime()
): PageContextProvider => ({
  getCurrentContext: async () => {
    if (!runtime) {
      return unsupportedPageContext("Chrome extension runtime is not available.", "error");
    }

    return new Promise<HostPageContext>((resolve) => {
      try {
        runtime.sendMessage({ type: "MICHI_GET_PAGE_CONTEXT" }, (response) => {
          const lastError = runtime.lastError;

          if (lastError?.message) {
            resolve(unsupportedPageContext(lastError.message, "error"));
            return;
          }

          if (isPageContextMessage(response)) {
            resolve(response.context);
            return;
          }

          if (response?.type === "MICHI_PAGE_CONTEXT_ERROR") {
            resolve(unsupportedPageContext(response.reason, "error"));
            return;
          }

          resolve(unsupportedPageContext("Extension returned no page context.", "error"));
        });
      } catch (error) {
        resolve(
          unsupportedPageContext(
            error instanceof Error ? error.message : "Extension context request failed.",
            "error"
          )
        );
      }
    });
  },
  subscribe: () => () => undefined
});
