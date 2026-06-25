import { readCloudflarePageContext } from "./cloudflarePageReader";
import { mountMichiInjectedShell } from "./injectedShell";
import type { MichiRuntimeMessage } from "./runtimeMessages";

type RuntimeMessageSender = unknown;

type RuntimeApi = {
  onMessage: {
    addListener: (
      listener: (
        message: unknown,
        sender: RuntimeMessageSender,
        sendResponse: (response: MichiRuntimeMessage) => void
      ) => boolean | void
    ) => void;
  };
};

declare const chrome:
  | {
      runtime?: RuntimeApi;
    }
  | undefined;

mountMichiInjectedShell();

const isGetPageContextMessage = (
  message: unknown
): message is Extract<MichiRuntimeMessage, { type: "MICHI_GET_PAGE_CONTEXT" }> =>
  typeof message === "object" &&
  message !== null &&
  "type" in message &&
  message.type === "MICHI_GET_PAGE_CONTEXT";

chrome?.runtime?.onMessage.addListener((message, _sender, sendResponse) => {
  if (!isGetPageContextMessage(message)) {
    return undefined;
  }

  try {
    sendResponse({
      type: "MICHI_PAGE_CONTEXT",
      context: readCloudflarePageContext()
    });
  } catch (error) {
    sendResponse({
      type: "MICHI_PAGE_CONTEXT_ERROR",
      reason: error instanceof Error ? error.message : "Unable to read page context."
    });
  }

  return true;
});
