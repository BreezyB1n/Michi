import {
  productBlockingStateCopy,
  productGuideStepCopy,
  productPageStateCopy,
  sanitizeProviderText
} from "./productPresentation";
import type { RecoveryGuidance } from "./recoveryGuidance";
import type { GuideSession, GuideStep, ServiceKind } from "./types";

export type ActivityTone = "info" | "success" | "warning" | "error";

export type ActivityEventKind =
  | "intent-started"
  | "path-selected"
  | "page-check"
  | "confirmation-requested"
  | "confirmation-completed"
  | "recovery"
  | "completion"
  | "reset";

export type ActivityEvent = {
  id: string;
  sequence: number;
  kind: ActivityEventKind;
  title: string;
  detail: string;
  tone: ActivityTone;
};

export type ActivityEventInput = Omit<ActivityEvent, "id" | "sequence">;

export type ActivityTimeline = {
  events: ActivityEvent[];
  nextSequence: number;
};

export type PageCheckActivityOptions = {
  recoveryGuidance?: Pick<RecoveryGuidance, "title" | "action">;
};

export const createActivityTimeline = (): ActivityTimeline => ({
  events: [],
  nextSequence: 1
});

export const appendActivityEvent = (
  timeline: ActivityTimeline,
  event: ActivityEventInput
): ActivityTimeline => {
  const nextEvent: ActivityEvent = {
    ...event,
    id: `activity-${timeline.nextSequence}-${event.kind}`,
    sequence: timeline.nextSequence
  };

  return {
    events: [...timeline.events, nextEvent],
    nextSequence: timeline.nextSequence + 1
  };
};

export const resetActivityTimeline = (event: ActivityEventInput): ActivityTimeline =>
  appendActivityEvent(createActivityTimeline(), event);

export const activityEventForIntentStart = (intent: string): ActivityEventInput => ({
  kind: "intent-started",
  title: "Intent captured",
  detail: `Michi started from: ${sanitizeProviderText(intent.trim())}`,
  tone: "info"
});

export const activityEventForServiceKind = (kind: ServiceKind): ActivityEventInput =>
  kind === "static-site"
    ? {
        kind: "path-selected",
        title: "Site path selected",
        detail: "Michi routed the task toward a site publishing guide.",
        tone: "info"
      }
    : {
        kind: "path-selected",
        title: "Service path selected",
        detail: "Michi routed the task toward a service runtime guide.",
        tone: "info"
      };

export const activityEventForPageCheck = (
  session: GuideSession,
  options: PageCheckActivityOptions = {}
): ActivityEventInput => {
  const pageState = productPageStateCopy(session.pageState);

  if (session.pageState.blockingState) {
    const blockingState = productBlockingStateCopy(session.pageState.blockingState);
    const recoveryDetail = options.recoveryGuidance
      ? `${options.recoveryGuidance.title}: ${options.recoveryGuidance.action}`
      : `${blockingState.title}: ${blockingState.recoveryAction}`;

    return {
      kind: "recovery",
      title: "Check needs recovery",
      detail: recoveryDetail,
      tone: session.pageState.blockingState.id === "extension-runtime-unavailable" ? "error" : "warning"
    };
  }

  if (session.phase === "complete") {
    return activityEventForCompletion(session);
  }

  return {
    kind: "page-check",
    title: "Page check synced",
    detail: `Michi checked ${pageState.location} and found ${pageState.targetElement}.`,
    tone: "info"
  };
};

export const activityEventForCriticalConfirmation = (
  step: GuideStep | undefined
): ActivityEventInput => {
  const displayStep = productGuideStepCopy(step);
  const label = displayStep?.criticalAction?.label ?? "critical action";

  return {
    kind: "confirmation-requested",
    title: "Confirmation needed",
    detail: `Michi paused before ${label}.`,
    tone: "warning"
  };
};

export const activityEventForConfirmation = (
  step: GuideStep | undefined
): ActivityEventInput => {
  const displayStep = productGuideStepCopy(step);
  const label = displayStep?.criticalAction?.label ?? "critical action";

  return {
    kind: "confirmation-completed",
    title: "Action confirmed",
    detail: `The user confirmed ${label}.`,
    tone: "success"
  };
};

export const activityEventForRecovery = (session: GuideSession): ActivityEventInput => {
  const pageState = productPageStateCopy(session.pageState);

  return {
    kind: "recovery",
    title: "Recovery completed",
    detail: `Michi re-anchored the guide at ${pageState.location}.`,
    tone: "success"
  };
};

export const activityEventForCompletion = (session: GuideSession): ActivityEventInput => {
  const pageState = productPageStateCopy(session.pageState);

  return {
    kind: "completion",
    title: "Completion evidence passed",
    detail: pageState.evidence,
    tone: "success"
  };
};

export const activityEventForReset = (): ActivityEventInput => ({
  kind: "reset",
  title: "Session reset",
  detail: "Michi cleared the guide history and is ready for a new task.",
  tone: "info"
});
