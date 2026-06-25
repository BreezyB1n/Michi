import type { HostPageContext } from "../domain/types";

export type MichiRuntimeMessage =
  | { type: "MICHI_GET_PAGE_CONTEXT" }
  | { type: "MICHI_PAGE_CONTEXT"; context: HostPageContext }
  | { type: "MICHI_PAGE_CONTEXT_ERROR"; reason: string };

export const isGetPageContextMessage = (
  message: unknown
): message is Extract<MichiRuntimeMessage, { type: "MICHI_GET_PAGE_CONTEXT" }> =>
  typeof message === "object" &&
  message !== null &&
  "type" in message &&
  message.type === "MICHI_GET_PAGE_CONTEXT";

export const isPageContextMessage = (
  message: unknown
): message is Extract<MichiRuntimeMessage, { type: "MICHI_PAGE_CONTEXT" }> =>
  typeof message === "object" &&
  message !== null &&
  "type" in message &&
  message.type === "MICHI_PAGE_CONTEXT" &&
  "context" in message;
