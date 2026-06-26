import {
  createGuideSession,
  guideSessionReducer
} from "../domain/guideSessionReducer";
import type { WorkersGuideShellPhase } from "../domain/workersGuideFlow";
import type { GuideSession, ServiceKind } from "../domain/types";

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

const backendSessionFromIntent = (intent: string) =>
  guideSessionReducer(sessionFromIntent(intent), {
    type: "choose-service-kind",
    kind: "backend-api"
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

const workersSessionForShellState = (
  state: ExtensionGuideSessionBridgeState
): GuideSession | undefined => {
  if (
    state.activeStepIndex === undefined ||
    (state.phase !== "guide" && state.phase !== "confirm" && state.phase !== "complete")
  ) {
    return undefined;
  }

  let session = backendSessionFromIntent(state.intent);
  const targetStepIndex = Math.min(
    Math.max(state.activeStepIndex, 0),
    Math.max(session.steps.length - 1, 0)
  );

  while (session.activeStepIndex < targetStepIndex && session.phase !== "complete") {
    const advanced = guideSessionReducer(session, { type: "advance" });
    session =
      advanced.phase === "confirm"
        ? guideSessionReducer(advanced, { type: "confirm-critical-action" })
        : advanced;
  }

  if (state.phase === "confirm") {
    return {
      ...session,
      phase: "confirm"
    };
  }

  if (state.phase === "complete") {
    return {
      ...session,
      phase: "complete"
    };
  }

  return session;
};

const projectWorkersSessionToShellState = (
  state: ExtensionGuideSessionBridgeState,
  session: GuideSession | undefined
): ExtensionGuideSessionBridgeState => {
  if (!session) {
    return state;
  }

  switch (session.phase) {
    case "guide":
    case "confirm":
    case "complete":
      return {
        ...state,
        intent: session.intent,
        phase: session.phase,
        activeStepIndex: session.activeStepIndex
      };
    default:
      return state;
  }
};

const projectFlowActionFromReducer = (
  state: ExtensionGuideSessionBridgeState,
  action: "previous" | "advance" | "confirm-critical-action"
): ExtensionGuideSessionBridgeState => {
  const session = workersSessionForShellState(state);

  if (!session) {
    return state;
  }

  return projectWorkersSessionToShellState(state, guideSessionReducer(session, { type: action }));
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

export const previousStepFromReducer = (
  state: ExtensionGuideSessionBridgeState
): ExtensionGuideSessionBridgeState => projectFlowActionFromReducer(state, "previous");

export const nextStepFromReducer = (
  state: ExtensionGuideSessionBridgeState
): ExtensionGuideSessionBridgeState => projectFlowActionFromReducer(state, "advance");

export const confirmCriticalActionFromReducer = (
  state: ExtensionGuideSessionBridgeState
): ExtensionGuideSessionBridgeState =>
  projectFlowActionFromReducer(state, "confirm-critical-action");

export const completeGuideFromReducer = (
  state: ExtensionGuideSessionBridgeState,
  canComplete: boolean
): ExtensionGuideSessionBridgeState =>
  canComplete ? projectFlowActionFromReducer(state, "advance") : state;
