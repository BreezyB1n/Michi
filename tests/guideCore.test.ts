import { describe, expect, it } from "vitest";
import {
  advanceStep,
  applyHostPageContext,
  chooseServiceKind,
  confirmCriticalAction,
  hostPageContextToPageState,
  recoverFromBlockingState,
  resetSession,
  simulateBlockingState,
  startSession
} from "../src/domain/guideCore";
import {
  createCloudflareMockPageContextProvider,
  pageDriftContextForStep
} from "../src/domain/pageContextProvider";
import { unsupportedPageContext } from "../src/domain/extensionPageContextProvider";

const sampleIntent = "I want to build a small service that other people can access.";

describe("Guide Agent Core", () => {
  it("starts from a user intent and enters clarification", () => {
    const session = startSession(sampleIntent);

    expect(session.intent).toBe(sampleIntent);
    expect(session.phase).toBe("clarify");
    expect(session.steps).toHaveLength(0);
  });

  it("maps backend API intent to Cloudflare Workers", () => {
    const session = chooseServiceKind(startSession(sampleIntent), "backend-api");

    expect(session.phase).toBe("guide");
    expect(session.serviceKind).toBe("backend-api");
    expect(session.selectedCapability?.id).toBe("cloudflare-workers");
    expect(session.selectedCapability?.concept).toContain("Compute");
  });

  it("maps static website intent to Cloudflare Pages guide steps", () => {
    const session = chooseServiceKind(startSession("Publish a static site."), "static-site");

    expect(session.phase).toBe("guide");
    expect(session.serviceKind).toBe("static-site");
    expect(session.selectedCapability?.id).toBe("cloudflare-pages");
    expect(session.selectedCapability?.concept).toContain("Hosting");
    expect(session.steps).toHaveLength(5);
    expect(session.steps[1].title).toBe("Create a Pages project");
  });

  it("generates Workers guide steps with action, purpose, and completion checks", () => {
    const session = chooseServiceKind(startSession(sampleIntent), "backend-api");

    expect(session.steps.length).toBeGreaterThanOrEqual(4);
    for (const step of session.steps) {
      expect(step.action).not.toHaveLength(0);
      expect(step.purpose).not.toHaveLength(0);
      expect(step.completionCheck).not.toHaveLength(0);
    }
  });

  it("requires confirmation before advancing a critical write action", () => {
    let session = chooseServiceKind(startSession(sampleIntent), "backend-api");
    session = advanceStep(session);

    expect(session.steps[session.activeStepIndex].criticalAction?.label).toBe("Create Worker");
    const confirmation = advanceStep(session);

    expect(confirmation.phase).toBe("confirm");
    expect(confirmation.activeStepIndex).toBe(session.activeStepIndex);
  });

  it("advances a critical action only after explicit confirmation", () => {
    let session = chooseServiceKind(startSession(sampleIntent), "backend-api");
    session = advanceStep(session);
    session = advanceStep(session);
    session = confirmCriticalAction(session);

    expect(session.phase).toBe("guide");
    expect(session.activeStepIndex).toBe(2);
    expect(session.pageState.evidence).toContain("Worker draft");
  });

  it("turns a blocking state into a recovery step and then returns to guide flow", () => {
    let session = chooseServiceKind(startSession(sampleIntent), "backend-api");
    session = simulateBlockingState(session, "not-signed-in");

    expect(session.phase).toBe("recovery");
    expect(session.pageState.blockingState?.title).toBe("Not signed in");

    session = recoverFromBlockingState(session);

    expect(session.phase).toBe("guide");
    expect(session.pageState.blockingState).toBeUndefined();
    expect(session.pageState.evidence).toContain("Signed in");
  });

  it("maps host page context into page state with route target and provider evidence", () => {
    const session = chooseServiceKind(startSession(sampleIntent), "backend-api");
    const provider = createCloudflareMockPageContextProvider();
    const context = provider.setStepIndex(0);

    const pageState = hostPageContextToPageState(context, session.steps[0]);

    expect(pageState.location).toBe("Cloudflare dashboard / Home");
    expect(pageState.targetElement).toBe("Workers & Pages sidebar item");
    expect(pageState.evidence).toContain("Provider synced");
    expect(pageState.completionSatisfied).toBe(true);
  });

  it("maps page drift host context into a recovery step", () => {
    const session = chooseServiceKind(startSession(sampleIntent), "backend-api");
    const drifted = applyHostPageContext(session, pageDriftContextForStep(0));

    expect(drifted.phase).toBe("recovery");
    expect(drifted.pageState.blockingState?.id).toBe("page-drift");
    expect(drifted.pageState.evidence).toContain("Page drift detected");
  });

  it("maps extension runtime failures into a recovery step", () => {
    const session = chooseServiceKind(startSession(sampleIntent), "backend-api");
    const failed = applyHostPageContext(
      session,
      unsupportedPageContext("No receiving end", "error")
    );

    expect(failed.phase).toBe("recovery");
    expect(failed.pageState.blockingState?.id).toBe("extension-runtime-unavailable");
    expect(failed.pageState.blockingState?.title).toBe("Extension runtime unavailable");
    expect(failed.pageState.evidence).toContain("No receiving end");
  });

  it("recovers from page drift when provider returns the expected context", () => {
    let session = chooseServiceKind(startSession(sampleIntent), "backend-api");
    const provider = createCloudflareMockPageContextProvider();

    session = applyHostPageContext(session, provider.simulatePageDrift());
    expect(session.phase).toBe("recovery");

    session = applyHostPageContext(session, provider.recoverToStep(session.activeStepIndex));

    expect(session.phase).toBe("guide");
    expect(session.pageState.blockingState).toBeUndefined();
    expect(session.pageState.evidence).toContain("Provider synced");
  });

  it("does not let provider context bypass critical confirmation", () => {
    let session = chooseServiceKind(startSession(sampleIntent), "backend-api");
    const provider = createCloudflareMockPageContextProvider();

    session = advanceStep(session);
    session = advanceStep(session);
    expect(session.phase).toBe("confirm");

    const checked = applyHostPageContext(session, provider.setStepIndex(2));

    expect(checked.phase).toBe("confirm");
    expect(checked.activeStepIndex).toBe(1);
  });

  it("reaches completion and recommends DNS as the follow-up route", () => {
    let session = chooseServiceKind(startSession(sampleIntent), "backend-api");

    session = advanceStep(session);
    session = advanceStep(session);
    session = confirmCriticalAction(session);
    session = advanceStep(session);
    session = advanceStep(session);
    session = confirmCriticalAction(session);
    session = advanceStep(session);

    expect(session.phase).toBe("complete");
    expect(session.followUpCapability?.id).toBe("cloudflare-dns");
    expect(session.pageState.evidence).toContain("Worker URL returned HTTP 200");
  });

  it("resets to an empty intent session", () => {
    const session = resetSession();

    expect(session.phase).toBe("intent");
    expect(session.intent).toBe("");
    expect(session.steps).toHaveLength(0);
  });
});
