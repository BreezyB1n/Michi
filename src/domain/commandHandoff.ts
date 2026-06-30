import { productBlockingStateCopy, productGuideStepCopy } from "./productPresentation";
import type { RecoveryGuidance } from "./recoveryGuidance";
import type { GuideSession } from "./types";

export type CommandActionId =
  | "start-guide"
  | "choose-backend-api"
  | "choose-static-site"
  | "check-page"
  | "advance-guide"
  | "complete-guide"
  | "confirm-action"
  | "recover-and-recheck"
  | "reset-guide";

export type CommandTone = "neutral" | "primary" | "success" | "warning";

export type CommandAction = {
  id: CommandActionId;
  label: string;
  description: string;
  tone: CommandTone;
};

export type CommandHandoff = {
  title: string;
  detail: string;
  tone: CommandTone;
  primaryAction: CommandAction;
  secondaryActions: CommandAction[];
  allActions: CommandAction[];
};

export type CommandHandoffOptions = {
  recoveryGuidance?: Pick<RecoveryGuidance, "title" | "action">;
};

const action = (
  id: CommandActionId,
  label: string,
  description: string,
  tone: CommandTone = "neutral"
): CommandAction => ({
  id,
  label,
  description,
  tone
});

const checkPageAction = () =>
  action("check-page", "Check now", "Refresh Michi's read of the current page.");

const resetAction = (label = "Clear guide") =>
  action("reset-guide", label, "Clear the current guide and return to intent entry.");

const createHandoff = (
  title: string,
  detail: string,
  primaryAction: CommandAction,
  secondaryActions: CommandAction[] = [],
  tone: CommandTone = primaryAction.tone
): CommandHandoff => ({
  title,
  detail,
  tone,
  primaryAction,
  secondaryActions,
  allActions: [primaryAction, ...secondaryActions]
});

export const commandHandoffForSession = (
  session: GuideSession,
  options: CommandHandoffOptions = {}
): CommandHandoff => {
  if (session.phase === "intent") {
    return createHandoff(
      "Ready for an intent",
      "Start with the user's goal, then Michi can choose the right guide path.",
      action("start-guide", "Start from intent", "Turn the intent into a guided session.", "primary"),
      [checkPageAction()],
      "primary"
    );
  }

  if (session.phase === "clarify") {
    return createHandoff(
      "Choose a guide path",
      "Pick the path that best matches the user's goal before Michi anchors the steps.",
      action("choose-backend-api", "Service path", "Guide a reachable service.", "primary"),
      [
        action("choose-static-site", "Site path", "Guide a reachable website."),
        resetAction()
      ],
      "primary"
    );
  }

  if (session.phase === "confirm") {
    const step = productGuideStepCopy(session.steps[session.activeStepIndex]);
    const label = step?.criticalAction?.label ?? "Confirm action";

    return createHandoff(
      "User confirmation needed",
      `Michi paused before ${label}. Continue only after the user explicitly confirms.`,
      action("confirm-action", "Confirm now", "Approve this critical step and continue.", "warning"),
      [checkPageAction(), resetAction()],
      "warning"
    );
  }

  if (session.phase === "recovery") {
    const blocking = session.pageState.blockingState
      ? productBlockingStateCopy(session.pageState.blockingState)
      : undefined;
    const recoveryDetail = options.recoveryGuidance
      ? `${options.recoveryGuidance.title}: ${options.recoveryGuidance.action}`
      : blocking
        ? `${blocking.title}: ${blocking.recoveryAction}`
        : "Michi needs to recover the guide before normal progress can continue.";

    return createHandoff(
      "Recovery is required",
      recoveryDetail,
      action(
        "recover-and-recheck",
        "Recover now",
        "Run the recovery path and refresh the page check.",
        "warning"
      ),
      [resetAction()],
      "warning"
    );
  }

  if (session.phase === "complete") {
    return createHandoff(
      "Primary path is complete",
      "The main guide evidence passed. Start another guide when the next task is ready.",
      resetAction("Start another guide"),
      [],
      "success"
    );
  }

  const currentStep = session.steps[session.activeStepIndex];
  const step = productGuideStepCopy(currentStep);
  const isFinalStep = session.activeStepIndex >= session.steps.length - 1;

  if (isFinalStep && session.pageState.completionSatisfied) {
    return createHandoff(
      "Completion evidence is ready",
      "Michi has the evidence needed to finish the primary guide path.",
      action("complete-guide", "Finish guide", "Finish the guide and show the follow-up route.", "success"),
      [checkPageAction(), resetAction()],
      "success"
    );
  }

  if (currentStep?.criticalAction && !session.pageState.completionSatisfied) {
    return createHandoff(
      "Confirmation will be required",
      `${step?.criticalAction?.label ?? "This step"} changes the account state, so Michi will pause before continuing.`,
      action(
        "advance-guide",
        "Review confirmation",
        "Move into the explicit confirmation step.",
        "warning"
      ),
      [checkPageAction(), resetAction()],
      "warning"
    );
  }

  if (!session.pageState.completionSatisfied) {
    return createHandoff(
      "Check the current page",
      "Michi needs fresh page evidence before recommending normal progress.",
      checkPageAction(),
      [resetAction()],
      "neutral"
    );
  }

  return createHandoff(
    "Next step is ready",
    "The current check passed, so Michi can move to the next guide step.",
    action("advance-guide", "Continue", "Continue to the next guide step.", "primary"),
    [checkPageAction(), resetAction()],
    "primary"
  );
};
