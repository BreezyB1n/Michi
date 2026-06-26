import { describe, expect, it } from "vitest";
import {
  createGuideSession,
  guideSessionReducer,
  hostPageContextToPageState
} from "../src/domain/guideSessionReducer";
import {
  createCloudflareMockPageContextProvider,
  pageDriftContextForStep
} from "../src/domain/pageContextProvider";
import { unsupportedPageContext } from "../src/domain/extensionPageContextProvider";

const sampleIntent = "I want to build a small service that other people can access.";

const backendSession = () =>
  guideSessionReducer(
    guideSessionReducer(createGuideSession(), { type: "start", intent: sampleIntent }),
    { type: "choose-service-kind", kind: "backend-api" }
  );

describe("Guide session reducer", () => {
  it("starts from intent and routes backend API to Workers", () => {
    const clarified = guideSessionReducer(createGuideSession(), {
      type: "start",
      intent: sampleIntent
    });
    const session = guideSessionReducer(clarified, {
      type: "choose-service-kind",
      kind: "backend-api"
    });

    expect(session.intent).toBe(sampleIntent);
    expect(session.phase).toBe("guide");
    expect(session.serviceKind).toBe("backend-api");
    expect(session.selectedCapability?.id).toBe("cloudflare-workers");
    expect(session.followUpCapability?.id).toBe("cloudflare-dns");
    expect(session.steps).toHaveLength(5);
    expect(session.pageState.location).toBe("Cloudflare dashboard / Home");
  });

  it("routes static-site intent to Pages completion without Workers steps", () => {
    const clarified = guideSessionReducer(createGuideSession(), {
      type: "start",
      intent: "I want to publish a static marketing site."
    });
    const session = guideSessionReducer(clarified, {
      type: "choose-service-kind",
      kind: "static-site"
    });

    expect(session.phase).toBe("complete");
    expect(session.serviceKind).toBe("static-site");
    expect(session.selectedCapability?.id).toBe("cloudflare-pages");
    expect(session.followUpCapability?.id).toBe("cloudflare-workers");
    expect(session.steps).toHaveLength(0);
    expect(session.pageState.evidence).toContain("Static website intent maps to Pages");
    expect(session.pageState.completionSatisfied).toBe(true);
  });

  it("does not mutate the input session when reducing actions", () => {
    const session = backendSession();
    const before = JSON.stringify(session);

    const next = guideSessionReducer(session, { type: "advance" });

    expect(JSON.parse(JSON.stringify(session))).toEqual(JSON.parse(before));
    expect(next).not.toBe(session);
    expect(next.activeStepIndex).toBe(1);
  });

  it("requires explicit confirmation before advancing through critical write steps", () => {
    let session = backendSession();

    session = guideSessionReducer(session, { type: "advance" });
    expect(session.steps[session.activeStepIndex].criticalAction?.label).toBe("Create Worker");

    const confirmation = guideSessionReducer(session, { type: "advance" });
    expect(confirmation.phase).toBe("confirm");
    expect(confirmation.activeStepIndex).toBe(1);

    const confirmed = guideSessionReducer(confirmation, { type: "confirm-critical-action" });
    expect(confirmed.phase).toBe("guide");
    expect(confirmed.activeStepIndex).toBe(2);
    expect(confirmed.pageState.evidence).toContain("Worker draft");
  });

  it("moves to the previous guide step and clamps at the first step", () => {
    let session = backendSession();

    session = guideSessionReducer(session, { type: "advance" });
    session = guideSessionReducer(session, { type: "advance" });
    session = guideSessionReducer(session, { type: "confirm-critical-action" });
    expect(session.activeStepIndex).toBe(2);

    const previous = guideSessionReducer(session, { type: "previous" });
    expect(previous.phase).toBe("guide");
    expect(previous.activeStepIndex).toBe(1);
    expect(previous.pageState.targetElement).toBe("Create Worker button");

    const first = guideSessionReducer(backendSession(), { type: "previous" });
    expect(first.activeStepIndex).toBe(0);
    expect(first.pageState.targetElement).toBe("Workers & Pages sidebar item");
  });

  it("does not let provider context bypass a pending critical confirmation", () => {
    const provider = createCloudflareMockPageContextProvider();
    let session = backendSession();

    session = guideSessionReducer(session, { type: "advance" });
    session = guideSessionReducer(session, { type: "advance" });
    expect(session.phase).toBe("confirm");

    const checked = guideSessionReducer(session, {
      type: "apply-host-page-context",
      context: provider.setStepIndex(2)
    });

    expect(checked.phase).toBe("confirm");
    expect(checked.activeStepIndex).toBe(1);
    expect(checked.pageState.evidence).toContain("Provider synced");
  });

  it("maps page drift and extension runtime failure contexts into recovery", () => {
    const drifted = guideSessionReducer(backendSession(), {
      type: "apply-host-page-context",
      context: pageDriftContextForStep(0)
    });

    expect(drifted.phase).toBe("recovery");
    expect(drifted.pageState.blockingState?.id).toBe("page-drift");

    const failed = guideSessionReducer(backendSession(), {
      type: "apply-host-page-context",
      context: unsupportedPageContext("No receiving end", "error")
    });

    expect(failed.phase).toBe("recovery");
    expect(failed.pageState.blockingState?.id).toBe("extension-runtime-unavailable");
  });

  it("recovers from blocking states and completes with DNS follow-up", () => {
    let session = guideSessionReducer(backendSession(), {
      type: "simulate-blocking-state",
      stateId: "not-signed-in"
    });

    expect(session.phase).toBe("recovery");
    expect(session.pageState.blockingState?.title).toBe("Not signed in");

    session = guideSessionReducer(session, { type: "recover-from-blocking-state" });
    expect(session.phase).toBe("guide");
    expect(session.pageState.blockingState).toBeUndefined();

    session = guideSessionReducer(session, { type: "advance" });
    session = guideSessionReducer(session, { type: "advance" });
    session = guideSessionReducer(session, { type: "confirm-critical-action" });
    session = guideSessionReducer(session, { type: "advance" });
    session = guideSessionReducer(session, { type: "advance" });
    session = guideSessionReducer(session, { type: "confirm-critical-action" });
    session = guideSessionReducer(session, { type: "advance" });

    expect(session.phase).toBe("complete");
    expect(session.followUpCapability?.id).toBe("cloudflare-dns");
    expect(session.pageState.evidence).toContain("Worker URL returned HTTP 200");
  });

  it("maps host page context into page state with route target and provider evidence", () => {
    const provider = createCloudflareMockPageContextProvider();
    const session = backendSession();
    const pageState = hostPageContextToPageState(provider.setStepIndex(0), session.steps[0]);

    expect(pageState.location).toBe("Cloudflare dashboard / Home");
    expect(pageState.targetElement).toBe("Workers & Pages sidebar item");
    expect(pageState.evidence).toContain("Provider synced");
    expect(pageState.completionSatisfied).toBe(true);
  });

  it("resets to an empty intent session", () => {
    const session = guideSessionReducer(backendSession(), { type: "reset" });

    expect(session.phase).toBe("intent");
    expect(session.intent).toBe("");
    expect(session.steps).toHaveLength(0);
  });
});
