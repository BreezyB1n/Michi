import {
  blockingStates,
  capabilities,
  pageStatesByStep,
  workersGuideSteps
} from "./siteSkillPack";
import type { BlockingState, GuideSession, PageState, ServiceKind } from "./types";

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
  PageState,
  ServiceKind
} from "./types";
