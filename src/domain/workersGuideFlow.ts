import { workersGuideSteps } from "./siteSkillPack";
import type { GuideStep, HostPageContext, PageTarget } from "./types";

export type WorkersGuideShellPhase =
  | "intent"
  | "clarify"
  | "guide"
  | "confirm"
  | "complete"
  | "static-complete";

export type WorkersGuideShellState = {
  phase: WorkersGuideShellPhase;
  activeStepIndex?: number;
};

const workersGuideTargetLabels: Record<string, string> = {
  "workers-pages-nav": "Workers & Pages sidebar item",
  "create-worker-button": "Create Worker button",
  "starter-handler": "Starter request handler",
  "deploy-worker-button": "Deploy button",
  "worker-url": "Worker URL"
};

export const finalWorkersGuideStepIndex = workersGuideSteps.length - 1;
export const finalWorkersGuideStep = workersGuideSteps[finalWorkersGuideStepIndex];

export const workersGuideStepForRouteId = (routeId: string): GuideStep | undefined =>
  workersGuideSteps.find((step) => step.expectedRouteId === routeId);

export const workersGuideStepIndexForRouteId = (routeId: string): number | undefined => {
  const index = workersGuideSteps.findIndex((step) => step.expectedRouteId === routeId);

  return index >= 0 ? index : undefined;
};

export const workersGuideStepForContext = (context: HostPageContext): GuideStep | undefined =>
  workersGuideStepForRouteId(context.routeId);

export const workersGuideStepIndexForContext = (
  context: HostPageContext
): number | undefined => workersGuideStepIndexForRouteId(context.routeId);

export const preferredTargetIdForRouteId = (routeId: string): string | undefined =>
  workersGuideStepForRouteId(routeId)?.targetId;

export const targetLabelForWorkersGuideTarget = (targetId: string): string =>
  workersGuideTargetLabels[targetId] ?? targetId;

export const preferredTargetForContext = (
  context: HostPageContext
): PageTarget | undefined => {
  const expectedTargetId = preferredTargetIdForRouteId(context.routeId);

  return expectedTargetId
    ? context.targets.find((target) => target.id === expectedTargetId)
    : context.targets[0];
};

export const checkedContextWorkersGuideState = (
  context: HostPageContext,
  state: WorkersGuideShellState
): WorkersGuideShellState => {
  const activeStepIndex = workersGuideStepIndexForContext(context);

  if (activeStepIndex !== undefined || context.routeId === "cloudflare.unsupported") {
    return {
      ...state,
      phase: "guide",
      activeStepIndex
    };
  }

  return state;
};

export const previousWorkersGuideState = (
  state: WorkersGuideShellState
): WorkersGuideShellState => ({
  ...state,
  activeStepIndex:
    state.activeStepIndex === undefined ? undefined : Math.max(state.activeStepIndex - 1, 0)
});

export const nextWorkersGuideState = (
  state: WorkersGuideShellState
): WorkersGuideShellState => {
  const activeStep =
    state.activeStepIndex === undefined ? undefined : workersGuideSteps[state.activeStepIndex];

  if (activeStep?.criticalAction) {
    return {
      ...state,
      phase: "confirm"
    };
  }

  return {
    ...state,
    activeStepIndex:
      state.activeStepIndex === undefined
        ? undefined
        : Math.min(state.activeStepIndex + 1, finalWorkersGuideStepIndex)
  };
};

export const confirmWorkersGuideActionState = (
  state: WorkersGuideShellState
): WorkersGuideShellState => ({
  ...state,
  phase: "guide",
  activeStepIndex:
    state.activeStepIndex === undefined
      ? undefined
      : Math.min(state.activeStepIndex + 1, finalWorkersGuideStepIndex)
});

export const canCompleteWorkersGuide = (
  context: HostPageContext | undefined,
  activeStepIndex: number | undefined
): boolean => {
  if (!context || activeStepIndex !== finalWorkersGuideStepIndex) {
    return false;
  }

  return (
    context.routeId === finalWorkersGuideStep.expectedRouteId &&
    context.targets.some((target) => target.id === finalWorkersGuideStep.targetId) &&
    context.signals.some((signal) => signal.severity === "success")
  );
};

export const completeWorkersGuideState = (
  state: WorkersGuideShellState,
  context: HostPageContext | undefined
): WorkersGuideShellState =>
  canCompleteWorkersGuide(context, state.activeStepIndex)
    ? {
        ...state,
        phase: "complete"
      }
    : state;
