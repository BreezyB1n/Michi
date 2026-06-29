import { describe, expect, it } from "vitest";
import {
  activityEventForCompletion,
  activityEventForCriticalConfirmation,
  activityEventForIntentStart,
  activityEventForPageCheck,
  activityEventForRecovery,
  activityEventForReset,
  activityEventForServiceKind,
  appendActivityEvent,
  createActivityTimeline,
  resetActivityTimeline
} from "../src/domain/activityTimeline";
import { chooseServiceKind, startSession } from "../src/domain/guideCore";
import { createCloudflareMockPageContextProvider } from "../src/domain/pageContextProvider";
import { applyHostPageContext } from "../src/domain/guideCore";

describe("activity timeline", () => {
  it("records deterministic event order and stable ids", () => {
    let timeline = createActivityTimeline();

    timeline = appendActivityEvent(timeline, activityEventForIntentStart("Build a small service"));
    timeline = appendActivityEvent(timeline, activityEventForServiceKind("backend-api"));

    expect(timeline.events).toMatchObject([
      {
        id: "activity-1-intent-started",
        sequence: 1,
        kind: "intent-started",
        title: "Intent captured",
        tone: "info"
      },
      {
        id: "activity-2-path-selected",
        sequence: 2,
        kind: "path-selected",
        title: "Service path selected",
        tone: "info"
      }
    ]);
    expect(timeline.nextSequence).toBe(3);
  });

  it("resets prior events while recording the reset event", () => {
    const timeline = appendActivityEvent(
      createActivityTimeline(),
      activityEventForIntentStart("Build a small service")
    );

    const resetTimeline = resetActivityTimeline(activityEventForReset());

    expect(timeline.events).toHaveLength(1);
    expect(resetTimeline.events).toEqual([
      {
        id: "activity-1-reset",
        sequence: 1,
        kind: "reset",
        title: "Session reset",
        detail: "Michi cleared the guide history and is ready for a new task.",
        tone: "info"
      }
    ]);
    expect(resetTimeline.nextSequence).toBe(2);
  });

  it("projects page checks into product-owned event semantics", () => {
    const provider = createCloudflareMockPageContextProvider();
    let session = startSession("Build a small service");
    session = chooseServiceKind(session, "backend-api");

    const checkedSession = applyHostPageContext(session, provider.setStepIndex(0));
    const checkEvent = activityEventForPageCheck(checkedSession);

    expect(checkEvent).toMatchObject({
      kind: "page-check",
      title: "Page check synced",
      tone: "info"
    });
    expect(checkEvent.detail).toContain("Michi checked Workspace / Home");

    const recoverySession = applyHostPageContext(checkedSession, provider.simulatePageDrift());
    const recoveryEvent = activityEventForPageCheck(recoverySession);

    expect(recoveryEvent).toMatchObject({
      kind: "recovery",
      title: "Check needs recovery",
      tone: "warning"
    });
    expect(recoveryEvent.detail).toContain("Page layout changed");
  });

  it("records confirmation, recovery, and completion events", () => {
    const provider = createCloudflareMockPageContextProvider();
    let session = startSession("Build a small service");
    session = chooseServiceKind(session, "backend-api");

    expect(activityEventForCriticalConfirmation(session.steps[1])).toMatchObject({
      kind: "confirmation-requested",
      title: "Confirmation needed",
      tone: "warning"
    });

    const recoveredSession = applyHostPageContext(session, provider.recoverToStep(0));
    expect(activityEventForRecovery(recoveredSession)).toMatchObject({
      kind: "recovery",
      title: "Recovery completed",
      tone: "success"
    });

    session = {
      ...session,
      phase: "complete",
      activeStepIndex: session.steps.length - 1,
      pageState: {
        location: "Deployment result",
        targetElement: "Service URL",
        evidence: "Service URL returned HTTP 200 with the starter response.",
        completionSatisfied: true
      }
    };

    expect(activityEventForCompletion(session)).toMatchObject({
      kind: "completion",
      title: "Completion evidence passed",
      tone: "success"
    });
  });
});
