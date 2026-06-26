import { guideStepsByServiceKind, workersGuideSteps } from "./siteSkillPack";
import type { GuideStep, HostPageContext, PageTarget, ServiceKind } from "./types";

export type WorkersGuideShellPhase =
  | "intent"
  | "clarify"
  | "guide"
  | "confirm"
  | "recovery"
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
  "worker-url": "Worker URL",
  "create-pages-button": "Create Pages project button",
  "static-assets-option": "Static assets option",
  "deploy-pages-button": "Deploy Pages button",
  "pages-url": "Pages URL"
};

export const finalWorkersGuideStepIndex = workersGuideSteps.length - 1;
export const finalWorkersGuideStep = workersGuideSteps[finalWorkersGuideStepIndex];

export const guideStepsForServiceKind = (kind: ServiceKind = "backend-api"): GuideStep[] =>
  guideStepsByServiceKind[kind];

export const finalGuideStepIndexForServiceKind = (kind: ServiceKind = "backend-api"): number =>
  guideStepsForServiceKind(kind).length - 1;

export const serviceKindForRouteId = (routeId: string): ServiceKind | undefined => {
  if (routeId.startsWith("cloudflare.pages.")) {
    return "static-site";
  }

  if (routeId.startsWith("cloudflare.workers.")) {
    return "backend-api";
  }

  return undefined;
};

export const guideStepForRouteId = (
  routeId: string,
  kind: ServiceKind = "backend-api"
): GuideStep | undefined => guideStepsForServiceKind(kind).find((step) => step.expectedRouteId === routeId);

export const guideStepIndexForRouteId = (
  routeId: string,
  kind: ServiceKind = "backend-api"
): number | undefined => {
  const index = guideStepsForServiceKind(kind).findIndex((step) => step.expectedRouteId === routeId);

  return index >= 0 ? index : undefined;
};

export const workersGuideStepForRouteId = (routeId: string): GuideStep | undefined =>
  guideStepForRouteId(routeId, "backend-api");

export const workersGuideStepIndexForRouteId = (routeId: string): number | undefined => {
  return guideStepIndexForRouteId(routeId, "backend-api");
};

export const workersGuideStepForContext = (context: HostPageContext): GuideStep | undefined =>
  workersGuideStepForRouteId(context.routeId);

export const workersGuideStepIndexForContext = (
  context: HostPageContext
): number | undefined => workersGuideStepIndexForRouteId(context.routeId);

export const guideStepIndexForContext = (
  context: HostPageContext,
  kind: ServiceKind = "backend-api"
): number | undefined => guideStepIndexForRouteId(context.routeId, kind);

export const preferredTargetIdForRouteId = (
  routeId: string,
  kind: ServiceKind = "backend-api"
): string | undefined => guideStepForRouteId(routeId, kind)?.targetId;

export const targetLabelForWorkersGuideTarget = (targetId: string): string =>
  workersGuideTargetLabels[targetId] ?? targetId;

export const preferredTargetForContextAndServiceKind = (
  context: HostPageContext,
  kind: ServiceKind = "backend-api"
): PageTarget | undefined => {
  const expectedTargetId = preferredTargetIdForRouteId(context.routeId, kind);

  return expectedTargetId
    ? context.targets.find((target) => target.id === expectedTargetId)
    : context.targets[0];
};

export const preferredTargetForContext = (
  context: HostPageContext
): PageTarget | undefined => preferredTargetForContextAndServiceKind(context, "backend-api");

export const canCompleteGuide = (
  context: HostPageContext | undefined,
  activeStepIndex: number | undefined,
  kind: ServiceKind = "backend-api"
): boolean => {
  const finalGuideStepIndex = finalGuideStepIndexForServiceKind(kind);
  const finalGuideStep = guideStepsForServiceKind(kind)[finalGuideStepIndex];

  if (!context || activeStepIndex !== finalGuideStepIndex) {
    return false;
  }

  return (
    context.routeId === finalGuideStep.expectedRouteId &&
    context.targets.some((target) => target.id === finalGuideStep.targetId) &&
    context.signals.some((signal) => signal.severity === "success")
  );
};

export const canCompleteWorkersGuide = (
  context: HostPageContext | undefined,
  activeStepIndex: number | undefined
): boolean => canCompleteGuide(context, activeStepIndex, "backend-api");
