import {
  createGuideSession,
  guideSessionReducer
} from "../domain/guideSessionReducer";
import {
  guideStepIndexForContext,
  serviceKindForRouteId
} from "../domain/workersGuideFlow";
import { blockingStates } from "../domain/siteSkillPack";
import type { WorkersGuideShellPhase } from "../domain/workersGuideFlow";
import type { GuideSession, GuideStep, HostPageContext, ServiceKind } from "../domain/types";

export type ExtensionGuideSessionBridgeState = {
  open: boolean;
  activeStepIndex?: number;
  intent: string;
  phase: WorkersGuideShellPhase;
  serviceKind?: ServiceKind;
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
  serviceSessionFromIntent(intent, "backend-api");

const serviceSessionFromIntent = (intent: string, kind: ServiceKind) =>
  guideSessionReducer(sessionFromIntent(intent), {
    type: "choose-service-kind",
    kind
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
    case "static-site":
      return {
        ...state,
        intent: session.intent,
        phase: "guide",
        activeStepIndex: session.steps.length > 0 ? session.activeStepIndex : undefined,
        serviceKind: session.serviceKind
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
    (state.phase !== "guide" &&
      state.phase !== "confirm" &&
      state.phase !== "recovery" &&
      state.phase !== "complete")
  ) {
    return undefined;
  }

  let session = serviceSessionFromIntent(state.intent, state.serviceKind ?? "backend-api");
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

  if (state.phase === "recovery") {
    return {
      ...session,
      phase: "recovery"
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
    case "recovery":
    case "complete":
      return {
        ...state,
        intent: session.intent,
        phase: session.phase,
        activeStepIndex: session.activeStepIndex,
        serviceKind: session.serviceKind
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

const hasUsableStepTarget = (context: HostPageContext, step: GuideStep | undefined) => {
  if (!step?.targetId) {
    return true;
  }

  const target = context.targets.find((pageTarget) => pageTarget.id === step.targetId);

  return target ? target.confidence === "high" || target.confidence === "medium" : false;
};

const contextWithPageDrift = (context: HostPageContext): HostPageContext => ({
  ...context,
  blockingState: blockingStates["page-drift"],
  signals: [
    {
      id: "page-drift",
      label: "Page drift",
      value:
        context.signals[0]?.value ??
        "Page drift detected: the expected target is not present in the current page context.",
      severity: "warning"
    }
  ]
});

const checkedContextForSession = (session: GuideSession, context: HostPageContext) => {
  const currentStep = session.steps[session.activeStepIndex];
  const missingExpectedTarget =
    session.phase === "confirm" &&
    currentStep?.expectedRouteId === context.routeId &&
    !hasUsableStepTarget(context, currentStep);

  return missingExpectedTarget ? contextWithPageDrift(context) : context;
};

const workersSessionForCheckedContext = (
  state: ExtensionGuideSessionBridgeState,
  context: HostPageContext
): GuideSession | undefined => {
  if (state.phase === "confirm") {
    return workersSessionForShellState(state);
  }

  const checkedServiceKind =
    state.serviceKind ?? serviceKindForRouteId(context.routeId) ?? "backend-api";
  const anchoredStepIndex =
    context.routeId === "cloudflare.unsupported"
      ? undefined
      : guideStepIndexForContext(context, checkedServiceKind);
  const anchoredPhase: WorkersGuideShellPhase = state.phase === "recovery" ? "recovery" : "guide";
  const shellState: ExtensionGuideSessionBridgeState =
    anchoredStepIndex === undefined
      ? { ...state, serviceKind: checkedServiceKind }
      : {
          ...state,
          phase: anchoredPhase,
          activeStepIndex: anchoredStepIndex,
          serviceKind: checkedServiceKind
        };

  return workersSessionForShellState(shellState);
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

export const checkedContextFromReducer = (
  state: ExtensionGuideSessionBridgeState,
  context: HostPageContext
): ExtensionGuideSessionBridgeState => {
  const session = workersSessionForCheckedContext(state, context);

  if (!session) {
    return context.routeId === "cloudflare.unsupported"
      ? {
          ...state,
          phase: "recovery",
          activeStepIndex: undefined
        }
      : state;
  }

  const checkedSession = guideSessionReducer(session, {
    type: "apply-host-page-context",
    context: checkedContextForSession(session, context)
  });

  if (context.routeId === "cloudflare.unsupported") {
    return {
      ...projectWorkersSessionToShellState(state, checkedSession),
      phase: "recovery",
      activeStepIndex: undefined
    };
  }

  return projectWorkersSessionToShellState(state, checkedSession);
};

export const resetGuideFromReducer = (
  state: ExtensionGuideSessionBridgeState
): ExtensionGuideSessionBridgeState => {
  const session = guideSessionReducer(createGuideSession(), { type: "reset" });

  return {
    ...state,
    intent: session.intent,
    phase: "intent",
    activeStepIndex: undefined,
    serviceKind: undefined
  };
};
