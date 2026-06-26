import {
  blockingStates,
  capabilities,
  pageStatesByStep,
  workersGuideSteps
} from "./siteSkillPack";
import { hasExtensionContextUnavailableSignal } from "./pageContextSignals";
import type {
  BlockingState,
  GuideSession,
  GuideStep,
  HostPageContext,
  PageState,
  ServiceKind
} from "./types";

const emptyPageState: PageState = {
  location: "Michi start",
  targetElement: "Intent input",
  evidence: "No guide path has started.",
  completionSatisfied: false
};

const createSession = (overrides: Partial<GuideSession> = {}): GuideSession => ({
  intent: "",
  steps: [],
  activeStepIndex: 0,
  pageState: emptyPageState,
  phase: "intent",
  ...overrides
});

const pageStateForStep = (index: number): PageState =>
  pageStatesByStep[Math.min(index, pageStatesByStep.length - 1)];

const targetForStep = (context: HostPageContext, step?: GuideStep) => {
  if (!step?.targetId) {
    return context.targets[0];
  }

  return context.targets.find((target) => target.id === step.targetId);
};

const hasUsableTarget = (context: HostPageContext, step?: GuideStep) => {
  const target = targetForStep(context, step);
  return target ? target.confidence === "high" || target.confidence === "medium" : false;
};

const hasExpectedRoute = (context: HostPageContext, step?: GuideStep) =>
  !step?.expectedRouteId || context.routeId === step.expectedRouteId;

const contextWithExtensionRuntimeUnavailable = (
  context: HostPageContext
): HostPageContext => ({
  ...context,
  blockingState: blockingStates["extension-runtime-unavailable"]
});

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

export const hostPageContextToPageState = (
  context: HostPageContext,
  step?: GuideStep
): PageState => {
  const target = targetForStep(context, step);
  const primarySignal = context.signals[0];

  if (context.blockingState) {
    const evidencePrefix =
      context.blockingState.id === "extension-runtime-unavailable"
        ? "Extension runtime unavailable"
        : "Page drift detected";

    return {
      location: context.locationLabel,
      targetElement: target?.label ?? "Expected page target missing",
      evidence: `${evidencePrefix}: ${primarySignal?.value ?? context.blockingState.reason}`,
      completionSatisfied: false,
      blockingState: context.blockingState
    };
  }

  return {
    location: context.locationLabel,
    targetElement: target?.label ?? "No target detected",
    evidence: `Provider synced: ${primarySignal?.value ?? "No page evidence reported."}`,
    completionSatisfied: context.signals.some((signal) => signal.severity === "success")
  };
};

export const applyHostPageContext = (
  session: GuideSession,
  context: HostPageContext
): GuideSession => {
  const currentStep = session.steps[session.activeStepIndex];
  const providerContext = hasExtensionContextUnavailableSignal(context)
    ? contextWithExtensionRuntimeUnavailable(context)
    : context;

  if (session.phase === "confirm" && !providerContext.blockingState) {
    return {
      ...session,
      pageState: hostPageContextToPageState(providerContext, currentStep)
    };
  }

  const effectiveContext =
    providerContext.blockingState || hasExpectedRoute(providerContext, currentStep) || !currentStep
      ? providerContext
      : contextWithPageDrift(providerContext);

  const anchored =
    !currentStep || effectiveContext.blockingState || hasUsableTarget(effectiveContext, currentStep);
  const pageState = hostPageContextToPageState(
    anchored ? effectiveContext : contextWithPageDrift(effectiveContext),
    currentStep
  );

  if (pageState.blockingState) {
    return {
      ...session,
      phase: "recovery",
      pageState
    };
  }

  return {
    ...session,
    phase: session.phase === "recovery" ? "guide" : session.phase,
    pageState
  };
};

export const startSession = (intent: string): GuideSession =>
  createSession({
    intent: intent.trim(),
    phase: "clarify",
    pageState: {
      location: "Michi clarification",
      targetElement: "Service type choices",
      evidence: "The user goal needs one routing choice before a guide path is created.",
      completionSatisfied: false
    }
  });

export const chooseServiceKind = (
  session: GuideSession,
  kind: ServiceKind
): GuideSession => {
  if (kind === "static-site") {
    return {
      ...session,
      serviceKind: kind,
      selectedCapability: capabilities["cloudflare-pages"],
      followUpCapability: capabilities["cloudflare-workers"],
      steps: [],
      activeStepIndex: 0,
      phase: "complete",
      pageState: {
        location: "Michi capability routing",
        targetElement: "Cloudflare Pages route",
        evidence:
          "Static website intent maps to Pages. The MVP keeps the runnable happy path on Workers.",
        completionSatisfied: true
      }
    };
  }

  return {
    ...session,
    serviceKind: kind,
    selectedCapability: capabilities["cloudflare-workers"],
    followUpCapability: capabilities["cloudflare-dns"],
    steps: workersGuideSteps,
    activeStepIndex: 0,
    phase: "guide",
    pageState: pageStateForStep(0)
  };
};

export const advanceStep = (session: GuideSession): GuideSession => {
  if (session.phase !== "guide") {
    return session;
  }

  const currentStep = session.steps[session.activeStepIndex];
  if (!currentStep) {
    return session;
  }

  if (currentStep.criticalAction && !session.pageState.completionSatisfied) {
    return {
      ...session,
      phase: "confirm"
    };
  }

  if (session.activeStepIndex >= session.steps.length - 1) {
    return {
      ...session,
      phase: "complete",
      pageState: pageStateForStep(session.activeStepIndex),
      followUpCapability: capabilities["cloudflare-dns"]
    };
  }

  const nextStepIndex = session.activeStepIndex + 1;
  return {
    ...session,
    activeStepIndex: nextStepIndex,
    pageState: pageStateForStep(nextStepIndex)
  };
};

export const confirmCriticalAction = (session: GuideSession): GuideSession => {
  if (session.phase !== "confirm") {
    return session;
  }

  const nextStepIndex = Math.min(session.activeStepIndex + 1, session.steps.length - 1);
  return {
    ...session,
    phase: "guide",
    activeStepIndex: nextStepIndex,
    pageState: pageStateForStep(nextStepIndex)
  };
};

export const simulateBlockingState = (
  session: GuideSession,
  stateId: BlockingState["id"]
): GuideSession => ({
  ...session,
  phase: "recovery",
  pageState: {
    ...session.pageState,
    evidence: `Blocked: ${blockingStates[stateId].title}. Run the recovery action before checking progress again.`,
    completionSatisfied: false,
    blockingState: blockingStates[stateId]
  }
});

export const recoverFromBlockingState = (session: GuideSession): GuideSession => ({
  ...session,
  phase: "guide",
  pageState: {
    ...pageStateForStep(session.activeStepIndex),
    evidence: `Signed in and ready. ${pageStateForStep(session.activeStepIndex).evidence}`
  }
});

export const resetSession = (): GuideSession => createSession();

export type {
  BlockingState,
  Capability,
  GuideSession,
  GuideStep,
  HostPageContext,
  PageState,
  ServiceKind
} from "./types";
