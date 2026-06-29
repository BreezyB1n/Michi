import { createPageContextProviderFromAdapter } from "../domain/pageContextAdapter";
import { createCloudflarePageContextAdapter } from "./cloudflarePageContextAdapter";
import { mountMichiInjectedShell } from "./injectedShell";
import { isGetPageContextMessage, type MichiRuntimeMessage } from "./runtimeMessages";

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

const pageContextProvider = createPageContextProviderFromAdapter(
  createCloudflarePageContextAdapter()
);

mountMichiInjectedShell();

chrome?.runtime?.onMessage.addListener((message, _sender, sendResponse) => {
  if (!isGetPageContextMessage(message)) {
    return undefined;
  }

  void pageContextProvider
    .getCurrentContext()
    .then((context) => {
      sendResponse({
        type: "MICHI_PAGE_CONTEXT",
        context
      });
    })
    .catch((error: unknown) => {
      sendResponse({
        type: "MICHI_PAGE_CONTEXT_ERROR",
        reason: error instanceof Error ? error.message : "Unable to read page context."
      });
    });

  return true;
});
