import {
  createGuideSession,
  guideSessionReducer
} from "../domain/guideSessionReducer";
import type { WorkersGuideShellPhase } from "../domain/workersGuideFlow";
import type { ServiceKind } from "../domain/types";

export type ExtensionGuideSessionBridgeState = {
  open: boolean;
  activeStepIndex?: number;
  intent: string;
  phase: WorkersGuideShellPhase;
};

type ClarifyBridgeState = ExtensionGuideSessionBridgeState & {
  phase: "clarify";
};

const isClarifyBridgeState = (
  state: ExtensionGuideSessionBridgeState
): state is ClarifyBridgeState => state.phase === "clarify";

const sessionFromIntent = (intent: string) =>
  guideSessionReducer(createGuideSession(), {
    type: "start",
    intent
  });

const assertNever = (value: never): never => {
  throw new Error(`Unsupported service kind: ${value}`);
};

const serviceChoiceFromReducer = (
  state: ClarifyBridgeState,
  kind: ServiceKind
): ExtensionGuideSessionBridgeState => {
  const session = guideSessionReducer(sessionFromIntent(state.intent), {
    type: "choose-service-kind",
    kind
  });

  switch (kind) {
    case "backend-api":
      return {
        ...state,
        intent: session.intent,
        phase: "guide",
        activeStepIndex: session.steps.length > 0 ? session.activeStepIndex : undefined
      };
    case "static-site":
      return {
        ...state,
        intent: session.intent,
        phase: "static-complete",
        activeStepIndex: undefined
      };
    default:
      return assertNever(kind);
  }
};

const chooseServiceKindFromReducer = (
  state: ExtensionGuideSessionBridgeState,
  kind: ServiceKind
): ExtensionGuideSessionBridgeState => {
  if (!isClarifyBridgeState(state)) {
    return state;
  }

  return serviceChoiceFromReducer(state, kind);
};

export const startGuideFromReducer = (
  state: ExtensionGuideSessionBridgeState
): ExtensionGuideSessionBridgeState => {
  const session = sessionFromIntent(state.intent);

  return {
    ...state,
    intent: session.intent,
    phase: "clarify",
    activeStepIndex: undefined
  };
};

export const chooseBackendApiFromReducer = (
  state: ExtensionGuideSessionBridgeState
): ExtensionGuideSessionBridgeState => chooseServiceKindFromReducer(state, "backend-api");

export const chooseStaticSiteFromReducer = (
  state: ExtensionGuideSessionBridgeState
): ExtensionGuideSessionBridgeState => chooseServiceKindFromReducer(state, "static-site");
