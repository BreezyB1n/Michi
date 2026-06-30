import {
  productCapabilityCopy,
  productTargetLabel,
  sanitizeProviderText
} from "./productPresentation";
import { serviceKindForRouteId } from "./workersGuideFlow";
import type { BlockingState, GuideStep, HostPageContext, ServiceKind } from "./types";

export type RecoveryGuidanceKind =
  | "unsupported-page"
  | "route-mismatch"
  | "target-missing"
  | "runtime-unavailable"
  | "generic";

export type RecoveryGuidance = {
  kind: RecoveryGuidanceKind;
  title: string;
  reason: string;
  impact: string;
  action: string;
};

type RecoveryGuidanceInput = {
  blockingState?: BlockingState;
  context?: HostPageContext;
  serviceKind?: ServiceKind;
  step?: GuideStep;
};

const capabilityName = (serviceKind: ServiceKind | undefined) =>
  productCapabilityCopy(undefined, serviceKind).name;

const isUnsupportedContext = (context: HostPageContext | undefined) =>
  context?.routeId === "cloudflare.unsupported" || context?.routeId === "michi.unsupported";

const hasExpectedTarget = (context: HostPageContext | undefined, step: GuideStep | undefined) => {
  if (!context || !step?.targetId) {
    return true;
  }

  return context.targets.some((target) => target.id === step.targetId);
};

export const recoveryGuidanceForState = ({
  blockingState,
  context,
  serviceKind,
  step
}: RecoveryGuidanceInput): RecoveryGuidance => {
  if (blockingState?.id === "extension-runtime-unavailable") {
    return {
      kind: "runtime-unavailable",
      title: "Page read unavailable",
      reason: "Michi could not read the active page from the browser runtime.",
      impact: "The guide state is preserved, but Michi needs a fresh page read before normal progress can continue.",
      action: "Refresh the active page or reload Michi, then choose Recover now."
    };
  }

  if (isUnsupportedContext(context)) {
    return {
      kind: "unsupported-page",
      title: "Unsupported page",
      reason: "The checked page is outside the current guide surface.",
      impact: "Normal guide progress is paused until Michi can anchor the next step on a supported page.",
      action: "Open a supported workspace page, then choose Recover now."
    };
  }

  const detectedServiceKind = context ? serviceKindForRouteId(context.routeId) : undefined;
  if (serviceKind && detectedServiceKind && detectedServiceKind !== serviceKind) {
    return {
      kind: "route-mismatch",
      title: "Wrong guide area",
      reason: `The active guide is ${capabilityName(serviceKind)}, but the checked page looks like ${capabilityName(detectedServiceKind)}.`,
      impact: "Michi keeps the current guide selected so a stray page check does not silently change the user's goal.",
      action: `Return to the ${capabilityName(serviceKind)} path, then choose Recover now.`
    };
  }

  if (step && !hasExpectedTarget(context, step)) {
    return {
      kind: "target-missing",
      title: "Expected control missing",
      reason: `Michi cannot find ${productTargetLabel(step.targetId)} on the checked page.`,
      impact: "Michi cannot safely anchor this step until the expected control is visible.",
      action: "Wait for the page to finish loading or return to the expected step, then choose Recover now."
    };
  }

  return {
    kind: "generic",
    title: sanitizeProviderText(blockingState?.title) || "Recovery needed",
    reason:
      sanitizeProviderText(blockingState?.reason) ||
      "Michi needs a recovery check before normal progress can continue.",
    impact: "Normal guide progress is paused until the blocking state is resolved.",
    action:
      sanitizeProviderText(blockingState?.recoveryAction) ||
      "Resolve the blocking state, then choose Recover now."
  };
};
