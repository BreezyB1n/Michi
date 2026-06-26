import { describe, expect, it } from "vitest";
import {
  chooseBackendApiFromReducer,
  chooseStaticSiteFromReducer,
  startGuideFromReducer
} from "../src/extension/extensionGuideSessionBridge";

describe("Extension guide session bridge", () => {
  it("starts the injected shell guide through the shared reducer", () => {
    const state = startGuideFromReducer({
      open: true,
      intent: " Build a JSON API for customers. ",
      phase: "intent"
    });

    expect(state).toEqual({
      open: true,
      intent: "Build a JSON API for customers.",
      phase: "clarify",
      activeStepIndex: undefined
    });
  });

  it("projects backend API choice from reducer output into shell guide state", () => {
    const state = chooseBackendApiFromReducer({
      open: true,
      intent: "Build a JSON API for customers.",
      phase: "clarify"
    });

    expect(state).toEqual({
      open: true,
      intent: "Build a JSON API for customers.",
      phase: "guide",
      activeStepIndex: 0
    });
  });

  it("projects static-site choice from reducer output into shell static completion state", () => {
    const state = chooseStaticSiteFromReducer({
      open: true,
      intent: "Publish a static site.",
      phase: "clarify",
      activeStepIndex: 1
    });

    expect(state).toEqual({
      open: true,
      intent: "Publish a static site.",
      phase: "static-complete",
      activeStepIndex: undefined
    });
  });

  it("does not project service choices outside clarification", () => {
    const state = {
      open: true,
      intent: "Build a JSON API for customers.",
      phase: "confirm" as const,
      activeStepIndex: 1
    };

    expect(chooseBackendApiFromReducer(state)).toBe(state);
    expect(chooseStaticSiteFromReducer(state)).toBe(state);
  });
});
