import { describe, expect, it } from "vitest";
import {
  advanceStep,
  chooseServiceKind,
  confirmCriticalAction,
  resetSession,
  simulateBlockingState,
  startSession
} from "../src/domain/guideCore";
import { commandHandoffForSession } from "../src/domain/commandHandoff";
import type { CommandActionId } from "../src/domain/commandHandoff";
import { createGuideSession } from "../src/domain/guideSessionReducer";

const actionIds = (ids: CommandActionId[]) => expect.arrayContaining(ids);

describe("command handoff", () => {
  it("recommends starting from the intent phase", () => {
    const handoff = commandHandoffForSession(resetSession());

    expect(handoff.title).toBe("Ready for an intent");
    expect(handoff.primaryAction).toMatchObject({
      id: "start-guide",
      label: "Start from intent",
      tone: "primary"
    });
    expect(handoff.secondaryActions.map((action) => action.id)).toEqual(
      actionIds(["check-page"])
    );
  });

  it("recommends an explicit path choice during clarification", () => {
    const handoff = commandHandoffForSession(startSession("Publish something useful."));

    expect(handoff.title).toBe("Choose a guide path");
    expect(handoff.primaryAction).toMatchObject({
      id: "choose-backend-api",
      label: "Service path"
    });
    expect(handoff.secondaryActions.map((action) => action.id)).toEqual(
      actionIds(["choose-static-site", "reset-guide"])
    );
  });

  it("recommends normal guide progress when the active step is satisfied", () => {
    const session = chooseServiceKind(startSession("Build a service."), "backend-api");
    const handoff = commandHandoffForSession(session);

    expect(handoff.title).toBe("Next step is ready");
    expect(handoff.primaryAction).toMatchObject({
      id: "advance-guide",
      label: "Continue"
    });
    expect(handoff.secondaryActions.map((action) => action.id)).toEqual(
      actionIds(["check-page", "reset-guide"])
    );
  });

  it("separates critical guide progress from confirmation completion", () => {
    const session = advanceStep(chooseServiceKind(startSession("Build a service."), "backend-api"));
    const handoff = commandHandoffForSession(session);

    expect(handoff.title).toBe("Confirmation will be required");
    expect(handoff.primaryAction).toMatchObject({
      id: "advance-guide",
      label: "Review confirmation",
      tone: "warning"
    });
  });

  it("does not expose normal progress while waiting for confirmation", () => {
    const needsConfirmation = advanceStep(
      advanceStep(chooseServiceKind(startSession("Build a service."), "backend-api"))
    );
    const handoff = commandHandoffForSession(needsConfirmation);

    expect(needsConfirmation.phase).toBe("confirm");
    expect(handoff.title).toBe("User confirmation needed");
    expect(handoff.primaryAction.id).toBe("confirm-action");
    expect(handoff.allActions.map((action) => action.id)).not.toContain("advance-guide");
    expect(handoff.allActions.map((action) => action.id)).not.toContain("complete-guide");
  });

  it("does not expose normal progress while recovery is blocking the guide", () => {
    const blocked = simulateBlockingState(
      chooseServiceKind(startSession("Build a service."), "backend-api"),
      "page-drift"
    );
    const handoff = commandHandoffForSession(blocked);

    expect(blocked.phase).toBe("recovery");
    expect(handoff.title).toBe("Recovery is required");
    expect(handoff.primaryAction.id).toBe("recover-and-recheck");
    expect(handoff.allActions.map((action) => action.id)).not.toContain("advance-guide");
    expect(handoff.allActions.map((action) => action.id)).not.toContain("complete-guide");
  });

  it("handles recovery phase when the runtime supplies guidance without a blocking state", () => {
    const recoverySession = createGuideSession({
      phase: "recovery",
      pageState: {
        location: "Workspace route",
        targetElement: "Expected target",
        evidence: "Route guidance is available.",
        completionSatisfied: false
      }
    });

    const handoff = commandHandoffForSession(recoverySession);

    expect(handoff.title).toBe("Recovery is required");
    expect(handoff.primaryAction.id).toBe("recover-and-recheck");
  });

  it("recommends finishing when the final guide step is satisfied", () => {
    let session = chooseServiceKind(startSession("Build a service."), "backend-api");
    session = advanceStep(session);
    session = advanceStep(session);
    session = confirmCriticalAction(session);
    session = advanceStep(session);
    session = advanceStep(session);
    session = confirmCriticalAction(session);

    const handoff = commandHandoffForSession(session);

    expect(session.phase).toBe("guide");
    expect(session.activeStepIndex).toBe(session.steps.length - 1);
    expect(handoff.title).toBe("Completion evidence is ready");
    expect(handoff.primaryAction).toMatchObject({
      id: "complete-guide",
      label: "Finish guide",
      tone: "success"
    });
  });

  it("recommends starting another guide after completion", () => {
    let session = chooseServiceKind(startSession("Build a service."), "backend-api");
    session = advanceStep(session);
    session = advanceStep(session);
    session = confirmCriticalAction(session);
    session = advanceStep(session);
    session = advanceStep(session);
    session = confirmCriticalAction(session);
    session = advanceStep(session);

    const handoff = commandHandoffForSession(session);

    expect(session.phase).toBe("complete");
    expect(handoff.title).toBe("Primary path is complete");
    expect(handoff.primaryAction).toMatchObject({
      id: "reset-guide",
      label: "Start another guide"
    });
  });
});
