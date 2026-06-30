import { describe, expect, it } from "vitest";
import { unsupportedPageContext } from "../src/domain/extensionPageContextProvider";
import { blockingStates } from "../src/domain/siteSkillPack";
import { readinessChecklistForState } from "../src/domain/readiness";
import type { HostPageContext } from "../src/domain/types";

const hostContext = (overrides: Partial<HostPageContext> = {}): HostPageContext => ({
  url: "https://dash.example.test/current",
  title: "Current workspace",
  product: "cloudflare",
  locationLabel: "Workspace / Build area",
  routeId: "cloudflare.workers.overview",
  detectedAt: "2026-06-30T00:00:00.000Z",
  targets: [
    {
      id: "create-worker-button",
      label: "Create Worker button",
      role: "button",
      text: "Create Worker",
      confidence: "high"
    }
  ],
  signals: [
    {
      id: "page-check",
      label: "Page check",
      value: "Page check synced.",
      severity: "info"
    }
  ],
  ...overrides
});

const copyForChecklist = (checklist: ReturnType<typeof readinessChecklistForState>) =>
  checklist.items.map((item) => `${item.label} ${item.detail}`).join(" ");

const expectProductOnlyReadiness = (copy: string) => {
  expect(copy).not.toMatch(/\b(?:Cloudflare|Workers|Worker|Pages|DNS)\b|cloudflare\.|workers\.dev|pages\.dev|dash\.cloudflare/i);
};

describe("first-run readiness", () => {
  it("marks a first-open usable page as ready", () => {
    const checklist = readinessChecklistForState({
      panelOpen: true,
      phase: "intent",
      context: hostContext()
    });

    expect(checklist.title).toBe("First-run readiness");
    expect(checklist.visible).toBe(true);
    expect(checklist.items).toMatchObject([
      { id: "panel-active", label: "Panel active", tone: "ready" },
      { id: "page-check", label: "Page check available", tone: "ready" },
      { id: "guide-state", label: "Guide state ready", tone: "ready" },
      { id: "page-fit", label: "Page usable", tone: "ready" }
    ]);
    expectProductOnlyReadiness(copyForChecklist(checklist));
  });

  it("asks for a page check when no checked page is available yet", () => {
    const checklist = readinessChecklistForState({
      panelOpen: true,
      phase: "intent"
    });

    expect(checklist.items.find((item) => item.id === "page-fit")).toMatchObject({
      label: "Page needs check",
      tone: "pending",
      detail: "Run Check page before relying on page anchoring."
    });
    expectProductOnlyReadiness(copyForChecklist(checklist));
  });

  it("treats the extension initial placeholder as needing a check", () => {
    const checklist = readinessChecklistForState({
      panelOpen: true,
      phase: "intent",
      context: unsupportedPageContext("Run Check to read the current page from the extension.")
    });

    expect(checklist.items.find((item) => item.id === "page-fit")).toMatchObject({
      label: "Page needs check",
      tone: "pending"
    });
    expectProductOnlyReadiness(copyForChecklist(checklist));
  });

  it("marks blocked pages as needing recovery", () => {
    const checklist = readinessChecklistForState({
      panelOpen: true,
      phase: "intent",
      context: hostContext({
        routeId: "cloudflare.unsupported",
        locationLabel: "Unsupported workspace area",
        targets: [],
        blockingState: blockingStates["page-drift"]
      })
    });

    expect(checklist.items.find((item) => item.id === "page-fit")).toMatchObject({
      label: "Page needs recovery",
      tone: "warning",
      detail: "Recover the current page state before anchoring a guide."
    });
    expectProductOnlyReadiness(copyForChecklist(checklist));
  });

  it("marks runtime failures from a checked page as needing recovery", () => {
    const checklist = readinessChecklistForState({
      panelOpen: true,
      phase: "intent",
      context: unsupportedPageContext("No receiving end", "error")
    });

    expect(checklist.items.find((item) => item.id === "page-fit")).toMatchObject({
      label: "Page needs recovery",
      tone: "warning"
    });
    expectProductOnlyReadiness(copyForChecklist(checklist));
  });

  it("can show a first-run recovery checklist before a guide step starts", () => {
    const checklist = readinessChecklistForState({
      panelOpen: true,
      phase: "recovery",
      firstRunRecovery: true,
      context: hostContext({
        routeId: "cloudflare.unsupported",
        targets: []
      })
    });

    expect(checklist.visible).toBe(true);
    expect(checklist.items.find((item) => item.id === "page-fit")).toMatchObject({
      label: "Page needs recovery",
      tone: "warning"
    });
    expectProductOnlyReadiness(copyForChecklist(checklist));
  });

  it("hides first-run readiness after the guide starts", () => {
    const checklist = readinessChecklistForState({
      panelOpen: true,
      phase: "guide",
      context: hostContext()
    });

    expect(checklist.visible).toBe(false);
    expect(checklist.items.find((item) => item.id === "guide-state")).toMatchObject({
      label: "Guide already started",
      tone: "ready"
    });
  });
});
