import {
  createGuideSession,
  guideSessionReducer
} from "./guideSessionReducer";
import type {
  BlockingState,
  HostPageContext,
  GuideSession,
  ServiceKind
} from "./types";

export { hostPageContextToPageState } from "./guideSessionReducer";

export const applyHostPageContext = (
  session: GuideSession,
  context: HostPageContext
): GuideSession =>
  guideSessionReducer(session, {
    type: "apply-host-page-context",
    context
  });

export const startSession = (intent: string): GuideSession =>
  guideSessionReducer(createGuideSession(), {
    type: "start",
    intent
  });

export const chooseServiceKind = (
  session: GuideSession,
  kind: ServiceKind
): GuideSession =>
  guideSessionReducer(session, {
    type: "choose-service-kind",
    kind
  });

export const advanceStep = (session: GuideSession): GuideSession =>
  guideSessionReducer(session, { type: "advance" });

export const confirmCriticalAction = (session: GuideSession): GuideSession =>
  guideSessionReducer(session, { type: "confirm-critical-action" });

export const simulateBlockingState = (
  session: GuideSession,
  stateId: BlockingState["id"]
): GuideSession =>
  guideSessionReducer(session, {
    type: "simulate-blocking-state",
    stateId
  });

export const recoverFromBlockingState = (session: GuideSession): GuideSession =>
  guideSessionReducer(session, { type: "recover-from-blocking-state" });

export const resetSession = (): GuideSession =>
  guideSessionReducer(createGuideSession(), { type: "reset" });

export type {
  BlockingState,
  Capability,
  GuideSession,
  GuideStep,
  HostPageContext,
  PageState,
  ServiceKind
} from "./types";
