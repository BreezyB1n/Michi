import type { HostPageContext, PageSignal } from "./types";

export const extensionContextUnavailableSignalId = "extension-context-unavailable";

export const isExtensionContextUnavailableSignal = (signal: PageSignal) =>
  signal.id === extensionContextUnavailableSignalId && signal.severity === "error";

export const hasExtensionContextUnavailableSignal = (context: HostPageContext) =>
  context.signals.some(isExtensionContextUnavailableSignal);
