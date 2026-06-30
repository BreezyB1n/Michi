import type { GuidePhase, HostPageContext } from "./types";

export type ReadinessTone = "ready" | "pending" | "warning";

export type ReadinessItemId =
  | "panel-active"
  | "page-check"
  | "guide-state"
  | "page-fit";

export type ReadinessItem = {
  id: ReadinessItemId;
  label: string;
  detail: string;
  tone: ReadinessTone;
};

export type ReadinessChecklist = {
  title: "First-run readiness";
  visible: boolean;
  items: ReadinessItem[];
};

type ReadinessPhase = GuidePhase | "static-complete";

type ReadinessInput = {
  panelOpen: boolean;
  phase: ReadinessPhase;
  context?: HostPageContext;
  pageCheckAvailable?: boolean;
  firstRunRecovery?: boolean;
};

const isFirstRunPhase = (phase: ReadinessPhase, firstRunRecovery = false) =>
  phase === "intent" || firstRunRecovery;

const hasRuntimeErrorSignal = (context: HostPageContext | undefined) =>
  context?.routeId === "michi.unsupported" &&
  context.signals.some((signal) => signal.severity === "error");

const isUncheckedPlaceholderContext = (context: HostPageContext | undefined) =>
  context?.routeId === "michi.unsupported" && !hasRuntimeErrorSignal(context);

const isBlockedContext = (context: HostPageContext | undefined) =>
  Boolean(
    context?.blockingState ||
      context?.routeId === "cloudflare.unsupported" ||
      hasRuntimeErrorSignal(context)
  );

const pageFitItem = (context: HostPageContext | undefined): ReadinessItem => {
  if (!context) {
    return {
      id: "page-fit",
      label: "Page needs check",
      detail: "Run Check page before relying on page anchoring.",
      tone: "pending"
    };
  }

  if (isUncheckedPlaceholderContext(context)) {
    return {
      id: "page-fit",
      label: "Page needs check",
      detail: "Run Check page before relying on page anchoring.",
      tone: "pending"
    };
  }

  if (isBlockedContext(context)) {
    return {
      id: "page-fit",
      label: "Page needs recovery",
      detail: "Recover the current page state before anchoring a guide.",
      tone: "warning"
    };
  }

  return {
    id: "page-fit",
    label: "Page usable",
    detail: "Current page can be checked for guide targets.",
    tone: "ready"
  };
};

export const readinessChecklistForState = ({
  panelOpen,
  phase,
  context,
  pageCheckAvailable = true,
  firstRunRecovery = false
}: ReadinessInput): ReadinessChecklist => ({
  title: "First-run readiness",
  visible: isFirstRunPhase(phase, firstRunRecovery),
  items: [
    {
      id: "panel-active",
      label: panelOpen ? "Panel active" : "Panel collapsed",
      detail: panelOpen ? "Michi is attached to this page." : "Open Michi to view guidance.",
      tone: panelOpen ? "ready" : "pending"
    },
    {
      id: "page-check",
      label: pageCheckAvailable ? "Page check available" : "Page check unavailable",
      detail: pageCheckAvailable
        ? "Check can refresh Michi's page read."
        : "Page checking is not available for this surface.",
      tone: pageCheckAvailable ? "ready" : "warning"
    },
    {
      id: "guide-state",
      label: isFirstRunPhase(phase, firstRunRecovery)
        ? "Guide state ready"
        : "Guide already started",
      detail: isFirstRunPhase(phase, firstRunRecovery)
        ? "Guide state is local and can be reset."
        : "First-run readiness is complete for this guide.",
      tone: "ready"
    },
    pageFitItem(context)
  ]
});
