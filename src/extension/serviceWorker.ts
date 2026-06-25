import type { MichiRuntimeMessage } from "./runtimeMessages";

type RuntimeMessageSender = unknown;

type RuntimeApi = {
  lastError?: { message?: string };
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

type TabsApi = {
  query: (
    queryInfo: { active: boolean; currentWindow: boolean },
    callback: (tabs: Array<{ id?: number }>) => void
  ) => void;
  sendMessage: (
    tabId: number,
    message: MichiRuntimeMessage,
    callback: (response?: MichiRuntimeMessage) => void
  ) => void;
};

declare const chrome:
  | {
      runtime?: RuntimeApi;
      tabs?: TabsApi;
    }
  | undefined;

const errorResponse = (reason: string): MichiRuntimeMessage => ({
  type: "MICHI_PAGE_CONTEXT_ERROR",
  reason
});

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

  if (!chrome.tabs) {
    sendResponse(errorResponse("Chrome tabs API is unavailable."));
    return true;
  }

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTabId = tabs[0]?.id;

    if (typeof activeTabId !== "number") {
      sendResponse(errorResponse("No active tab is available for Michi page context."));
      return;
    }

    chrome.tabs?.sendMessage(activeTabId, message, (response) => {
      const lastError = chrome.runtime?.lastError;

      if (lastError?.message) {
        sendResponse(errorResponse(lastError.message));
        return;
      }

      sendResponse(response ?? errorResponse("Content script returned no page context."));
    });
  });

  return true;
});
