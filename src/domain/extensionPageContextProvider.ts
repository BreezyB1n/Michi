import {
  isPageContextMessage,
  type MichiRuntimeMessage
} from "../extension/runtimeMessages";
import { extensionContextUnavailableSignalId } from "./pageContextSignals";
import { sanitizeProviderText } from "./productPresentation";
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

type ExtensionPageContextProviderOptions = {
  timeoutMs?: number;
};

const defaultContextRequestTimeoutMs = 2_000;

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
  product: "michi",
  locationLabel: "Unsupported page context",
  routeId: "michi.unsupported",
  detectedAt: new Date().toISOString(),
  targets: [],
  signals: [
    {
      id: extensionContextUnavailableSignalId,
      label: "Extension context unavailable",
      value: sanitizeProviderText(reason),
      severity
    }
  ]
});

const getDefaultRuntime = (): ExtensionRuntimeLike | undefined =>
  typeof chrome !== "undefined" ? chrome.runtime : undefined;

export const createExtensionPageContextProvider = (
  runtime = getDefaultRuntime(),
  options: ExtensionPageContextProviderOptions = {}
): PageContextProvider => ({
  getCurrentContext: async () => {
    if (!runtime) {
      return unsupportedPageContext("Extension runtime is not available.", "error");
    }

    return new Promise<HostPageContext>((resolve) => {
      const timeoutMs = options.timeoutMs ?? defaultContextRequestTimeoutMs;
      let settled = false;
      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      const resolveOnce = (context: HostPageContext) => {
        if (settled) {
          return;
        }

        settled = true;
        if (timeoutId !== undefined) {
          clearTimeout(timeoutId);
        }
        resolve(context);
      };

      timeoutId = setTimeout(() => {
        resolveOnce(
          unsupportedPageContext(
            `Extension page context request timed out after ${timeoutMs}ms.`,
            "error"
          )
        );
      }, timeoutMs);

      try {
        runtime.sendMessage({ type: "MICHI_GET_PAGE_CONTEXT" }, (response) => {
          const lastError = runtime.lastError;

          if (lastError?.message) {
            resolveOnce(unsupportedPageContext(lastError.message, "error"));
            return;
          }

          if (isPageContextMessage(response)) {
            resolveOnce(response.context);
            return;
          }

          if (response?.type === "MICHI_PAGE_CONTEXT_ERROR") {
            resolveOnce(unsupportedPageContext(response.reason, "error"));
            return;
          }

          resolveOnce(unsupportedPageContext("Extension returned no page context.", "error"));
        });
      } catch (error) {
        resolveOnce(
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
