import { readCloudflarePageContext } from "./cloudflarePageReader";
import { blockingStates, capabilities, pageStatesByServiceKind } from "../domain/siteSkillPack";
import {
  canCompleteGuide,
  finalGuideStepIndexForServiceKind,
  guideStepsForServiceKind,
  guideStepForRouteId,
  preferredTargetForContextAndServiceKind,
  preferredTargetIdForRouteId,
  serviceKindForRouteId
} from "../domain/workersGuideFlow";
import type { WorkersGuideShellPhase } from "../domain/workersGuideFlow";
import type { HostPageContext, PageTarget, ServiceKind } from "../domain/types";
import type { GuideSession } from "../domain/types";
import {
  productCapabilityCopy,
  productCompletionTitle,
  productGuideStepCopy,
  productLocationLabel,
  productRouteLabel,
  productSignalCopy,
  productTargetLabel,
  sanitizeProviderText
} from "../domain/productPresentation";
import {
  activityEventForConfirmation,
  activityEventForCriticalConfirmation,
  activityEventForIntentStart,
  activityEventForReset,
  activityEventForServiceKind,
  appendActivityEvent,
  createActivityTimeline,
  resetActivityTimeline,
  type ActivityEvent,
  type ActivityEventInput,
  type ActivityTimeline
} from "../domain/activityTimeline";
import {
  checkedContextFromReducer,
  chooseBackendApiFromReducer,
  chooseStaticSiteFromReducer,
  completeGuideFromReducer,
  confirmCriticalActionFromReducer,
  nextStepFromReducer,
  previousStepFromReducer,
  resetGuideFromReducer,
  startGuideFromReducer
} from "./extensionGuideSessionBridge";
import {
  commandHandoffForSession,
  type CommandAction,
  type CommandActionId
} from "../domain/commandHandoff";
import { recoveryGuidanceForState } from "../domain/recoveryGuidance";
import { readinessChecklistForState } from "../domain/readiness";

export { workersGuideStepForContext as guideStepForContext } from "../domain/workersGuideFlow";

const rootId = "michi-extension-root";
const shellCleanupByHost = new WeakMap<HTMLElement, () => void>();

type ShellLocation = {
  href: string;
  title: string;
};

type ShellState = {
  open: boolean;
  context?: HostPageContext;
  activeStepIndex?: number;
  intent: string;
  phase: WorkersGuideShellPhase;
  serviceKind?: ServiceKind;
  guideStarted: boolean;
  activityTimeline: ActivityTimeline;
};

type RecoveryGuidance = {
  title: string;
  reason: string;
  impact: string;
  recoveryAction: string;
};

const shellStyles = `
  :host {
    all: initial;
    color-scheme: light;
    font-family: "Geist Sans", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .shell {
    position: fixed;
    right: 18px;
    top: 88px;
    z-index: 2147483647;
    display: grid;
    gap: 8px;
    color: #171717;
  }

  .rail {
    border: 1px solid rgba(23, 23, 23, 0.16);
    background: rgba(239, 236, 205, 0.9);
    box-shadow: 0 18px 42px rgba(15, 23, 42, 0.12);
    backdrop-filter: blur(16px);
  }

  .rail {
    display: grid;
    gap: 6px;
    width: 92px;
    padding: 6px;
    border-radius: 16px;
  }

  .panel {
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: #171713;
    box-shadow: 0 24px 60px rgba(15, 23, 42, 0.28);
    backdrop-filter: blur(16px);
    color: #f1f0df;
  }

  button {
    all: unset;
    box-sizing: border-box;
    min-height: 38px;
    border-radius: 12px;
    display: grid;
    place-items: center;
    padding: 0 10px;
    font: 650 12px/1.2 inherit;
    cursor: pointer;
    color: inherit;
  }

  button:hover {
    background: rgba(0, 132, 189, 0.16);
  }

  textarea {
    all: unset;
    box-sizing: border-box;
    width: 100%;
    min-height: 92px;
    padding: 10px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.06);
    color: #f1f0df;
    font: 550 13px/1.45 inherit;
    resize: vertical;
  }

  .panel {
    width: min(320px, calc(100vw - 84px));
    border-radius: 16px;
    overflow: hidden;
  }

  .panel-header,
  .panel-body {
    padding: 14px;
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .panel-actions {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  h2,
  p,
  dl {
    margin: 0;
  }

  h2 {
    font: 750 16px/1.2 inherit;
    letter-spacing: -0.01em;
  }

  .eyebrow {
    margin-bottom: 4px;
    font: 700 10px/1.2 ui-monospace, SFMono-Regular, Menlo, monospace;
    letter-spacing: 0.12em;
    color: rgba(241, 240, 223, 0.5);
    text-transform: uppercase;
  }

  dl {
    display: grid;
    gap: 10px;
  }

  dt {
    margin-bottom: 3px;
    font: 700 10px/1.2 ui-monospace, SFMono-Regular, Menlo, monospace;
    color: rgba(241, 240, 223, 0.5);
  }

  dd {
    margin: 0;
    font: 550 13px/1.45 inherit;
    color: rgba(241, 240, 223, 0.86);
    overflow-wrap: anywhere;
  }

  .recovery {
    margin-bottom: 12px;
    padding: 12px;
    border: 1px solid rgba(245, 158, 11, 0.4);
    border-radius: 12px;
    background: rgba(245, 158, 11, 0.12);
  }

  .recovery-title {
    margin-bottom: 6px;
    font: 750 13px/1.2 inherit;
    color: #fcd34d;
  }

  .recovery p {
    font: 550 12px/1.45 inherit;
    color: rgba(241, 240, 223, 0.78);
  }

  .recovery p + p {
    margin-top: 6px;
  }

  .guide-summary {
    display: grid;
    gap: 10px;
    margin-bottom: 14px;
    padding-bottom: 14px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .readiness-summary {
    display: grid;
    gap: 10px;
    margin: 14px 0;
    padding: 11px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.055);
  }

  .readiness-list {
    display: grid;
    gap: 7px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .readiness-item {
    padding: 9px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.055);
  }

  .readiness-item[data-tone="ready"] {
    border-color: rgba(16, 185, 129, 0.32);
    background: rgba(16, 185, 129, 0.11);
  }

  .readiness-item[data-tone="pending"] {
    border-color: rgba(0, 132, 189, 0.3);
    background: rgba(0, 132, 189, 0.1);
  }

  .readiness-item[data-tone="warning"] {
    border-color: rgba(245, 158, 11, 0.4);
    background: rgba(245, 158, 11, 0.12);
  }

  .readiness-item strong {
    display: block;
    margin-bottom: 3px;
    font: 750 12px/1.25 inherit;
    color: #f1f0df;
  }

  .readiness-item span {
    display: block;
    font: 550 11px/1.45 inherit;
    color: rgba(241, 240, 223, 0.68);
    overflow-wrap: anywhere;
  }

  .activity-summary {
    display: grid;
    gap: 10px;
    margin-top: 14px;
  }

  .command-handoff {
    display: grid;
    gap: 10px;
    margin: 14px 0;
    padding: 11px;
    border: 1px solid rgba(0, 132, 189, 0.28);
    border-radius: 12px;
    background: rgba(0, 132, 189, 0.1);
  }

  .command-handoff[data-tone="warning"] {
    border-color: rgba(245, 158, 11, 0.44);
    background: rgba(245, 158, 11, 0.13);
  }

  .command-handoff[data-tone="success"] {
    border-color: rgba(16, 185, 129, 0.36);
    background: rgba(16, 185, 129, 0.12);
  }

  .command-detail {
    font: 550 12px/1.45 inherit;
    color: rgba(241, 240, 223, 0.7);
    overflow-wrap: anywhere;
  }

  .command-actions {
    display: grid;
    gap: 7px;
  }

  .command-secondary {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 7px;
  }

  .command-actions button {
    justify-content: space-between;
    min-height: 34px;
    border: 1px solid rgba(255, 255, 255, 0.14);
    background: rgba(255, 255, 255, 0.07);
    overflow-wrap: anywhere;
  }

  .command-actions button[data-primary="true"] {
    border-color: rgba(0, 132, 189, 0.42);
    background: rgba(0, 132, 189, 0.2);
  }

  .command-actions button[data-tone="warning"][data-primary="true"] {
    border-color: rgba(245, 158, 11, 0.5);
    background: rgba(245, 158, 11, 0.22);
  }

  .command-actions button[data-tone="success"][data-primary="true"] {
    border-color: rgba(16, 185, 129, 0.44);
    background: rgba(16, 185, 129, 0.18);
  }

  .activity-empty,
  .activity-item {
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.055);
  }

  .activity-empty {
    padding: 10px;
    font: 550 12px/1.45 inherit;
    color: rgba(241, 240, 223, 0.64);
  }

  .activity-list {
    display: grid;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .activity-item {
    display: grid;
    grid-template-columns: 26px minmax(0, 1fr);
    gap: 9px;
    padding: 9px;
  }

  .activity-item[data-tone="success"] {
    border-color: rgba(16, 185, 129, 0.36);
    background: rgba(16, 185, 129, 0.12);
  }

  .activity-item[data-tone="warning"],
  .activity-item[data-tone="error"] {
    border-color: rgba(245, 158, 11, 0.42);
    background: rgba(245, 158, 11, 0.13);
  }

  .activity-sequence {
    display: grid;
    width: 26px;
    height: 26px;
    place-items: center;
    border: 1px solid rgba(241, 240, 223, 0.18);
    border-radius: 50%;
    font: 700 11px/1 ui-monospace, SFMono-Regular, Menlo, monospace;
    color: rgba(241, 240, 223, 0.72);
  }

  .activity-title {
    margin-bottom: 3px;
    font: 750 12px/1.25 inherit;
    color: #f1f0df;
  }

  .activity-detail {
    font: 550 11px/1.45 inherit;
    color: rgba(241, 240, 223, 0.66);
    overflow-wrap: anywhere;
  }

  .capability {
    display: flex;
    align-items: baseline;
    gap: 8px;
    color: #f1f0df;
  }

  .capability strong {
    font: 750 13px/1.2 inherit;
  }

  .capability span {
    font: 700 10px/1.2 ui-monospace, SFMono-Regular, Menlo, monospace;
    color: rgba(241, 240, 223, 0.52);
    text-transform: uppercase;
  }

  .step-title {
    font: 750 15px/1.25 inherit;
    color: #f1f0df;
  }

  .step-toolbar {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .step-toolbar button {
    min-height: 34px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.06);
  }

  .step-toolbar button:disabled {
    cursor: not-allowed;
    color: rgba(241, 240, 223, 0.36);
    background: rgba(255, 255, 255, 0.04);
  }

  .target-highlight {
    position: fixed;
    z-index: 2147483646;
    border: 2px solid #0084bd;
    border-radius: 10px;
    box-shadow: 0 0 0 4px rgba(0, 132, 189, 0.18), 0 16px 36px rgba(15, 23, 42, 0.16);
    pointer-events: none;
  }
`;

const emptyContextCopy = `
  <p class="eyebrow">Page check</p>
  <p>No page check yet</p>
`;

const sampleIntent = "I want to build a small service that other people can access.";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export const recoveryGuidanceForContext = (
  context: HostPageContext,
  serviceKind: ServiceKind = serviceKindForRouteId(context.routeId) ?? "backend-api"
): RecoveryGuidance | undefined => {
  const detectedServiceKind = serviceKindForRouteId(context.routeId);
  const expectedStep = guideStepForRouteId(context.routeId, serviceKind);
  const expectedTargetId = expectedStep?.targetId ?? preferredTargetIdForRouteId(context.routeId, serviceKind);
  const needsGuidance =
    context.blockingState ||
    context.routeId === "cloudflare.unsupported" ||
    context.routeId === "michi.unsupported" ||
    (detectedServiceKind !== undefined && detectedServiceKind !== serviceKind) ||
    (expectedTargetId !== undefined && !context.targets.some((target) => target.id === expectedTargetId));

  if (!needsGuidance) {
    return undefined;
  }

  const guidance = recoveryGuidanceForState({
    blockingState:
      context.blockingState ??
      (needsGuidance ? blockingStates["page-drift"] : undefined),
    context,
    serviceKind,
    step: expectedStep
  });

  return {
    title: guidance.title,
    reason: guidance.reason,
    impact: guidance.impact,
    recoveryAction: guidance.action
  };
};

export const highlightStyleForTarget = (target: PageTarget | undefined) => {
  if (!target?.boundingBox) {
    return undefined;
  }

  const inset = 2;
  const { x, y, width, height } = target.boundingBox;

  return [
    `left: ${Math.max(Math.round(x) - inset, 0)}px`,
    `top: ${Math.max(Math.round(y) - inset, 0)}px`,
    `width: ${Math.max(Math.round(width) + inset * 2, 0)}px`,
    `height: ${Math.max(Math.round(height) + inset * 2, 0)}px`
  ].join("; ");
};

const highlightCopy = (
  context: HostPageContext,
  serviceKind: ServiceKind | undefined
) => {
  const detectedServiceKind = serviceKindForRouteId(context.routeId);
  if (serviceKind && detectedServiceKind && serviceKind !== detectedServiceKind) {
    return "";
  }

  const target = preferredTargetForContextAndServiceKind(
    context,
    serviceKind ?? detectedServiceKind ?? "backend-api"
  );
  const style = highlightStyleForTarget(target);

  if (!target || !style) {
    return "";
  }

  return `<div class="target-highlight" data-highlight style="${style}" aria-label="Highlighted target: ${escapeHtml(productTargetLabel(target))}"></div>`;
};

const completionEvidence = (context: HostPageContext | undefined) =>
  context?.signals.find((signal) => signal.severity === "success")?.value ??
  context?.signals[0]?.value ??
  "Service URL evidence is available.";

const guideStepForShellState = (state: ShellState) =>
  state.activeStepIndex === undefined || state.activeStepIndex < 0
    ? undefined
    : guideStepsForServiceKind(state.serviceKind ?? "backend-api")[state.activeStepIndex];

const activityEventForShellContext = (state: ShellState): ActivityEventInput | undefined => {
  if (!state.context) {
    return undefined;
  }

  const resolvedServiceKind =
    state.serviceKind ?? serviceKindForRouteId(state.context.routeId) ?? "backend-api";
  const guidance = recoveryGuidanceForContext(state.context, resolvedServiceKind);

  if (guidance) {
    return {
      kind: "recovery",
      title: "Check needs recovery",
      detail: `${guidance.title}: ${guidance.recoveryAction}`,
      tone: "warning"
    };
  }

  if (state.phase === "complete" || state.phase === "static-complete") {
    return {
      kind: "completion",
      title: "Completion evidence passed",
      detail: "Michi confirmed the evidence needed to finish this guide.",
      tone: "success"
    };
  }

  return {
    kind: "page-check",
    title: "Page check synced",
    detail: "Michi synced the checked page with the active guide step.",
    tone: "info"
  };
};

const activityEventCopy = (event: ActivityEvent) => `
  <li class="activity-item" data-tone="${escapeHtml(event.tone)}">
    <span class="activity-sequence">${event.sequence}</span>
    <div>
      <p class="activity-title">${escapeHtml(event.title)}</p>
      <p class="activity-detail">${escapeHtml(event.detail)}</p>
    </div>
  </li>
`;

const activityTimelineCopy = (timeline: ActivityTimeline) => {
  const visibleEvents = timeline.events.slice(-6).reverse();

  return `<section class="activity-summary" aria-label="Activity history">
    <div>
      <p class="eyebrow">Activity</p>
      <p class="step-title">Activity history</p>
    </div>
    ${
      visibleEvents.length
        ? `<ol class="activity-list" aria-label="Recent activity events">${visibleEvents.map(activityEventCopy).join("")}</ol>`
        : `<p class="activity-empty">No activity yet. Start a guide to see Michi's checks and decisions.</p>`
    }
  </section>`;
};

const shellSessionForCommandHandoff = (state: ShellState): GuideSession => {
  const serviceKind =
    state.serviceKind ?? (state.context ? serviceKindForRouteId(state.context.routeId) : undefined);
  const steps = serviceKind ? guideStepsForServiceKind(serviceKind) : [];
  const activeStepIndex = Math.max(state.activeStepIndex ?? 0, 0);
  const pageStates = serviceKind ? pageStatesByServiceKind[serviceKind] : undefined;
  const basePageState = pageStates?.[Math.min(activeStepIndex, Math.max(pageStates.length - 1, 0))] ?? {
    location: "Michi start",
    targetElement: "Intent input",
    evidence: "No guide path has started.",
    completionSatisfied: false
  };
  const phase = state.phase === "static-complete" ? "complete" : state.phase;
  const recoveryGuidance =
    state.context && phase === "recovery"
      ? recoveryGuidanceForContext(state.context, serviceKind ?? "backend-api")
      : undefined;
  const isFinalStep =
    serviceKind !== undefined &&
    activeStepIndex >= finalGuideStepIndexForServiceKind(serviceKind);
  const liveCompletionSatisfied = canCompleteGuide(
    state.context,
    state.activeStepIndex,
    serviceKind ?? "backend-api"
  );

  return {
    intent: state.intent,
    serviceKind,
    selectedCapability:
      serviceKind === "static-site"
        ? capabilities["cloudflare-pages"]
        : serviceKind === "backend-api"
          ? capabilities["cloudflare-workers"]
          : undefined,
    followUpCapability: phase === "complete" ? capabilities["cloudflare-dns"] : undefined,
    steps,
    activeStepIndex,
    phase,
    pageState: {
      ...basePageState,
      completionSatisfied: isFinalStep ? liveCompletionSatisfied : basePageState.completionSatisfied,
      blockingState: recoveryGuidance
        ? {
            id: "page-drift",
            title: recoveryGuidance.title,
            reason: recoveryGuidance.reason,
            recoveryAction: recoveryGuidance.recoveryAction
          }
        : undefined
    }
  };
};

const commandActionCopy = (action: CommandAction, primary = false) => `
  <button
    type="button"
    data-command-action="${escapeHtml(action.id)}"
    ${primary ? "data-primary-panel-focus" : ""}
    data-primary="${primary ? "true" : "false"}"
    data-tone="${escapeHtml(action.tone)}"
    title="${escapeHtml(action.description)}"
    aria-label="${escapeHtml(action.label)}"
  >
    ${escapeHtml(action.label)}
  </button>
`;

const commandHandoffCopy = (state: ShellState) => {
  const shellSession = shellSessionForCommandHandoff(state);
  const resolvedServiceKind =
    state.serviceKind ?? (state.context ? serviceKindForRouteId(state.context.routeId) : undefined) ?? "backend-api";
  const guidance =
    state.context && shellSession.phase === "recovery"
      ? recoveryGuidanceForContext(state.context, resolvedServiceKind)
      : undefined;
  const handoff = commandHandoffForSession(shellSession, {
    recoveryGuidance: guidance
      ? {
          title: guidance.title,
          action: guidance.recoveryAction
        }
      : undefined
  });

  return `<section class="command-handoff" data-tone="${escapeHtml(handoff.tone)}" aria-label="Command handoff">
    <div>
      <p class="eyebrow">Command handoff</p>
      <p class="step-title">${escapeHtml(handoff.title)}</p>
    </div>
    <p class="command-detail">${escapeHtml(handoff.detail)}</p>
    <div class="command-actions" aria-label="Recommended commands">
      ${commandActionCopy(handoff.primaryAction, true)}
      ${
        handoff.secondaryActions.length
          ? `<div class="command-secondary">${handoff.secondaryActions.map((action) => commandActionCopy(action)).join("")}</div>`
          : ""
      }
    </div>
  </section>`;
};

const intentCopy = (intent: string) => `
  <section class="guide-summary" aria-label="Intent entry">
    <div>
      <p class="eyebrow">User intent</p>
      <textarea data-intent data-primary-panel-focus aria-label="User intent" rows="4">${escapeHtml(intent)}</textarea>
    </div>
    <button type="button" data-action="start-guide" aria-label="Start guide">Start guide</button>
  </section>
`;

const readinessCopy = (state: ShellState) => {
  const firstRunRecovery =
    state.phase === "recovery" && state.activeStepIndex === undefined && !state.guideStarted;
  const checklist = readinessChecklistForState({
    panelOpen: state.open,
    phase: state.phase === "static-complete" ? "complete" : state.phase,
    context: state.context,
    firstRunRecovery
  });

  if (!checklist.visible) {
    return "";
  }

  return `<section class="readiness-summary" aria-label="${escapeHtml(checklist.title)}">
    <div>
      <p class="eyebrow">Readiness</p>
      <p class="step-title">${escapeHtml(checklist.title)}</p>
    </div>
    <ol class="readiness-list">
      ${checklist.items
        .map(
          (item) => `<li class="readiness-item" data-tone="${escapeHtml(item.tone)}">
            <strong>${escapeHtml(item.label)}</strong>
            <span>${escapeHtml(item.detail)}</span>
          </li>`
        )
        .join("")}
    </ol>
  </section>`;
};

const clarificationCopy = (intent: string) => `
  <section class="guide-summary" aria-label="Service clarification">
    <div>
      <p class="eyebrow">User intent</p>
      <p>${escapeHtml(intent)}</p>
    </div>
    <div>
      <p class="eyebrow">Path decision</p>
      <p class="step-title">What kind of service are you building?</p>
    </div>
    <div class="step-toolbar" aria-label="Service type choices">
      <button type="button" data-action="choose-backend-api" aria-label="Backend logic or API">Backend logic or API</button>
      <button type="button" data-action="choose-static-site" aria-label="Static website">Static website</button>
    </div>
  </section>
`;

const staticSiteCopy = () => `
  <section class="guide-summary" aria-label="Static website route">
    <div>
      <p class="eyebrow">Capability</p>
      <p class="capability">
        <strong>${escapeHtml(productCapabilityCopy(capabilities["cloudflare-pages"]).name)}</strong>
        <span>${escapeHtml(productCapabilityCopy(capabilities["cloudflare-pages"]).concept)}</span>
      </p>
    </div>
    <p>${escapeHtml(productCapabilityCopy(capabilities["cloudflare-pages"]).explanation)}</p>
  </section>
`;

const confirmationCopy = (
  activeStepIndex: number | undefined,
  serviceKind: ServiceKind | undefined
) => {
  const step =
    activeStepIndex === undefined || activeStepIndex < 0
      ? undefined
      : productGuideStepCopy(guideStepsForServiceKind(serviceKind ?? "backend-api")[activeStepIndex]);
  const criticalAction = step?.criticalAction;

  if (!step || !criticalAction) {
    return "";
  }

  return `<section class="guide-summary" aria-label="Critical action confirmation">
    <div>
      <p class="eyebrow">Critical write action</p>
      <p class="step-title">Confirm ${escapeHtml(criticalAction.label)}</p>
    </div>
    <p>${escapeHtml(criticalAction.impact)}</p>
    <button type="button" data-action="confirm-action" aria-label="Confirm action">Confirm action</button>
  </section>`;
};

const completionCopy = (
  context: HostPageContext | undefined,
  serviceKind: ServiceKind | undefined
) => {
  const followUpCapability = productCapabilityCopy(capabilities["cloudflare-dns"]);

  return `<section class="guide-summary" aria-label="Guide completion">
    <div>
      <p class="eyebrow">Primary path complete</p>
      <p class="step-title">${productCompletionTitle(serviceKind)}</p>
    </div>
    <p>${escapeHtml(sanitizeProviderText(completionEvidence(context)))}</p>
    <div>
      <p class="eyebrow">Follow-up route</p>
      <p class="capability">
        <strong>${escapeHtml(followUpCapability.name)}</strong>
        <span>${escapeHtml(followUpCapability.concept)}</span>
      </p>
    </div>
    <p>${escapeHtml(followUpCapability.explanation)}</p>
  </section>`;
};

const guideSummaryCopy = (
  activeStepIndex: number | undefined,
  options: { canComplete?: boolean; serviceKind?: ServiceKind } = {}
) => {
  if (activeStepIndex === undefined || activeStepIndex < 0) {
    return "";
  }

  const serviceKind = options.serviceKind ?? "backend-api";
  const guideSteps = guideStepsForServiceKind(serviceKind);
  const step = productGuideStepCopy(guideSteps[activeStepIndex]);

  if (!step) {
    return "";
  }

  const capability =
    serviceKind === "static-site"
      ? productCapabilityCopy(capabilities["cloudflare-pages"])
      : productCapabilityCopy(capabilities["cloudflare-workers"]);
  const canGoPrevious = activeStepIndex > 0;
  const canGoNext = activeStepIndex < guideSteps.length - 1;
  const isFinalStep = activeStepIndex === finalGuideStepIndexForServiceKind(serviceKind);
  const forwardAction = isFinalStep ? "complete-guide" : "next-step";
  const forwardLabel = isFinalStep ? "Complete guide" : "Next step";
  const forwardDisabled = isFinalStep ? !options.canComplete : !canGoNext;

  return `<section class="guide-summary" aria-label="Current guide step">
    <div>
      <p class="eyebrow">Capability</p>
      <p class="capability">
        <strong>${escapeHtml(capability.name)}</strong>
        <span>${escapeHtml(capability.concept)}</span>
      </p>
    </div>
    <div>
      <p class="eyebrow">Step ${activeStepIndex + 1} / ${guideSteps.length}</p>
      <p class="step-title">${escapeHtml(step.title)}</p>
    </div>
    <dl>
      <div>
        <dt>Action</dt>
        <dd>${escapeHtml(step.action)}</dd>
      </div>
      <div>
        <dt>Step purpose</dt>
        <dd>${escapeHtml(step.purpose)}</dd>
      </div>
      <div>
        <dt>Completion check</dt>
        <dd>${escapeHtml(step.completionCheck)}</dd>
      </div>
    </dl>
    <div class="step-toolbar" aria-label="Guide step navigation">
      <button type="button" data-action="previous-step" aria-label="Previous" ${canGoPrevious ? "" : "disabled"}>Previous</button>
      <button type="button" data-action="${forwardAction}" aria-label="${forwardLabel}" ${forwardDisabled ? "disabled" : ""}>${forwardLabel}</button>
    </div>
  </section>`;
};

const contextCopy = (
  context: HostPageContext,
  activeStepIndex: number | undefined,
  serviceKind: ServiceKind | undefined
) => {
  const resolvedServiceKind = serviceKind ?? serviceKindForRouteId(context.routeId) ?? "backend-api";
  const target = preferredTargetForContextAndServiceKind(context, resolvedServiceKind);
  const signal = context.signals[0];
  const guidance = recoveryGuidanceForContext(context, resolvedServiceKind);
  const signalCopy = signal ? productSignalCopy(signal) : undefined;

  return `
    ${
      guidance
        ? ""
        : guideSummaryCopy(activeStepIndex, {
            canComplete: canCompleteGuide(context, activeStepIndex, resolvedServiceKind),
            serviceKind: resolvedServiceKind
          })
    }
    ${
      guidance
        ? `<div class="recovery" role="status" aria-label="${escapeHtml(guidance.title)}">
            <p class="recovery-title">${escapeHtml(guidance.title)}</p>
            <p>${escapeHtml(sanitizeProviderText(guidance.reason))}</p>
            <p>${escapeHtml(sanitizeProviderText(guidance.impact))}</p>
            <p>${escapeHtml(sanitizeProviderText(guidance.recoveryAction))}</p>
          </div>`
        : ""
    }
    <dl>
      <div>
        <dt>Route</dt>
        <dd>${escapeHtml(productRouteLabel(context.routeId))}</dd>
      </div>
      <div>
        <dt>Location</dt>
        <dd>${escapeHtml(productLocationLabel(context.locationLabel))}</dd>
      </div>
      <div>
        <dt>Target</dt>
        <dd>${escapeHtml(productTargetLabel(target))}</dd>
      </div>
      <div>
        <dt>Evidence</dt>
        <dd>${escapeHtml(signalCopy ? signalCopy.label : "No evidence detected")}</dd>
      </div>
    </dl>
  `;
};

const panelBodyCopy = (state: ShellState) => {
  if (state.phase === "intent" && !state.context) {
    return `${intentCopy(state.intent)}${readinessCopy(state)}`;
  }

  if (state.context?.routeId === "cloudflare.unsupported") {
    return `${readinessCopy(state)}${contextCopy(state.context, undefined, state.serviceKind)}`;
  }

  if (state.phase === "clarify") {
    return clarificationCopy(state.intent);
  }

  if (state.phase === "static-complete") {
    return staticSiteCopy();
  }

  if (state.phase === "complete") {
    return completionCopy(state.context, state.serviceKind);
  }

  if (state.phase === "confirm") {
    return confirmationCopy(state.activeStepIndex, state.serviceKind);
  }

  if (state.context) {
    return contextCopy(state.context, state.activeStepIndex, state.serviceKind);
  }

  if (state.activeStepIndex !== undefined) {
    return guideSummaryCopy(state.activeStepIndex, { serviceKind: state.serviceKind });
  }

  return emptyContextCopy;
};

export const mountMichiInjectedShell = (
  doc: Document = document,
  location?: ShellLocation
) => {
  const existing = doc.getElementById(rootId);

  if (existing?.shadowRoot) {
    return existing;
  }

  const host = doc.createElement("div");
  host.id = rootId;
  doc.documentElement.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });
  const state: ShellState = {
    open: false,
    intent: sampleIntent,
    phase: "intent",
    guideStarted: false,
    activityTimeline: createActivityTimeline()
  };
  const ownerWindow = doc.defaultView ?? window;
  let pendingFocusSelector: string | undefined;
  const currentLocation = (): ShellLocation =>
    location ?? {
      href: ownerWindow.location.href,
      title: doc.title
    };
  const applyGuideState = (nextGuideState: {
    activeStepIndex?: number;
    intent: string;
    phase: WorkersGuideShellPhase;
    serviceKind?: ServiceKind;
  }) => {
    state.phase = nextGuideState.phase;
    state.activeStepIndex = nextGuideState.activeStepIndex;
    state.intent = nextGuideState.intent;
    state.serviceKind = nextGuideState.serviceKind;
    if (nextGuideState.phase === "intent") {
      state.guideStarted = false;
    } else if (nextGuideState.phase !== "recovery" || nextGuideState.activeStepIndex !== undefined) {
      state.guideStarted = true;
    }
  };
  const recordActivity = (events: ActivityEventInput | ActivityEventInput[] | undefined) => {
    if (!events) {
      return;
    }

    const nextEvents = Array.isArray(events) ? events : [events];
    state.activityTimeline = nextEvents.reduce(
      (timeline, event) => appendActivityEvent(timeline, event),
      state.activityTimeline
    );
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.defaultPrevented || event.key !== "Escape" || !state.open) {
      return;
    }

    const eventPath = typeof event.composedPath === "function" ? event.composedPath() : [];
    const eventTarget = event.target;
    const eventTargetIsDocument =
      eventTarget === doc || eventTarget === doc.body || eventTarget === doc.documentElement;
    const shellHasShadowFocus = shadow.activeElement !== null;
    const eventStartedInShell =
      eventPath.includes(host) ||
      eventPath.includes(shadow) ||
      (eventTarget instanceof Node && (host.contains(eventTarget) || shadow.contains(eventTarget))) ||
      (eventTargetIsDocument && shellHasShadowFocus);

    if (!eventStartedInShell) {
      return;
    }

    pendingFocusSelector = "[data-action='guide']";
    state.open = false;
    render();
  };

  const refreshCheckedContext = () => {
    if (!state.context) {
      return;
    }

    state.context = readCloudflarePageContext(doc, currentLocation());
    render();
  };

  const render = () => {
    shadow.innerHTML = `
      <style>${shellStyles}</style>
      <div class="shell" aria-label="Michi injected shell">
        ${state.context ? highlightCopy(state.context, state.serviceKind) : ""}
        <div class="rail" aria-label="Michi rail">
          <button type="button" data-action="guide" aria-label="Guide">Guide</button>
          <button type="button" data-action="check" aria-label="Check page">Check page</button>
        </div>
        ${
          state.open
            ? `<section data-panel class="panel" aria-label="Michi side panel">
                <div class="panel-header">
                  <div>
                    <p class="eyebrow">Michi agent</p>
                    <h2>Michi side panel</h2>
                  </div>
                  <div class="panel-actions" aria-label="Panel actions">
                    <button type="button" data-action="reset-guide" aria-label="Reset guide">Reset</button>
                    <button type="button" data-action="minimize" aria-label="Minimize panel">Min</button>
                  </div>
                </div>
                <div class="panel-body">
                  ${panelBodyCopy(state)}
                  ${commandHandoffCopy(state)}
                  ${activityTimelineCopy(state.activityTimeline)}
                </div>
              </section>`
            : ""
        }
      </div>
    `;

    const focusPrimaryPanelControl = () => {
      pendingFocusSelector = "[data-primary-panel-focus]";
    };

    shadow.querySelector("[data-action='guide']")?.addEventListener("click", () => {
      focusPrimaryPanelControl();
      state.open = true;
      render();
    });

    const checkPage = () => {
      focusPrimaryPanelControl();
      state.open = true;
      state.context = readCloudflarePageContext(doc, currentLocation());
      const nextGuideState = checkedContextFromReducer(state, state.context);
      applyGuideState(nextGuideState);
      recordActivity(activityEventForShellContext(state));
      render();
    };

    const minimize = () => {
      pendingFocusSelector = "[data-action='guide']";
      state.open = false;
      render();
    };

    const resetGuide = () => {
      const nextGuideState = resetGuideFromReducer(state);
      state.open = true;
      state.context = undefined;
      applyGuideState(nextGuideState);
      state.activityTimeline = resetActivityTimeline(activityEventForReset());
      pendingFocusSelector = "[data-intent]";
      render();
    };

    const previousStep = () => {
      const nextGuideState = previousStepFromReducer(state);
      applyGuideState(nextGuideState);
      focusPrimaryPanelControl();
      render();
    };

    const nextStep = () => {
      const previousStep = guideStepForShellState(state);
      const nextGuideState = nextStepFromReducer(state);
      applyGuideState(nextGuideState);
      if (nextGuideState.phase === "confirm") {
        recordActivity(activityEventForCriticalConfirmation(previousStep));
      }
      focusPrimaryPanelControl();
      render();
    };

    const startGuide = () => {
      const nextGuideState = startGuideFromReducer(state);
      applyGuideState(nextGuideState);
      recordActivity(activityEventForIntentStart(state.intent));
      focusPrimaryPanelControl();
      render();
    };

    const chooseBackendApi = () => {
      const nextGuideState = chooseBackendApiFromReducer(state);
      applyGuideState(nextGuideState);
      recordActivity(activityEventForServiceKind("backend-api"));
      focusPrimaryPanelControl();
      render();
    };

    const chooseStaticSite = () => {
      const nextGuideState = chooseStaticSiteFromReducer(state);
      applyGuideState(nextGuideState);
      recordActivity(activityEventForServiceKind("static-site"));
      focusPrimaryPanelControl();
      render();
    };

    const confirmAction = () => {
      const previousStep = guideStepForShellState(state);
      const nextGuideState = confirmCriticalActionFromReducer(state);
      applyGuideState(nextGuideState);
      recordActivity(activityEventForConfirmation(previousStep));
      focusPrimaryPanelControl();
      render();
    };

    const completeGuide = () => {
      const nextGuideState = completeGuideFromReducer(
        state,
        canCompleteGuide(state.context, state.activeStepIndex, state.serviceKind ?? "backend-api")
      );
      applyGuideState(nextGuideState);
      recordActivity(activityEventForShellContext(state));
      focusPrimaryPanelControl();
      render();
    };

    const runCommandAction = (actionId: CommandActionId) => {
      switch (actionId) {
        case "start-guide":
          startGuide();
          return;
        case "choose-backend-api":
          chooseBackendApi();
          return;
        case "choose-static-site":
          chooseStaticSite();
          return;
        case "check-page":
        case "recover-and-recheck":
          checkPage();
          return;
        case "advance-guide":
          nextStep();
          return;
        case "complete-guide":
          completeGuide();
          return;
        case "confirm-action":
          confirmAction();
          return;
        case "reset-guide":
          resetGuide();
          return;
      }
    };

    shadow.querySelector("[data-action='check']")?.addEventListener("click", checkPage);

    shadow.querySelector("[data-action='minimize']")?.addEventListener("click", minimize);

    shadow.querySelector("[data-action='reset-guide']")?.addEventListener("click", resetGuide);

    shadow.querySelector("[data-action='previous-step']")?.addEventListener("click", previousStep);

    shadow.querySelector("[data-action='next-step']")?.addEventListener("click", nextStep);

    shadow.querySelector("[data-intent]")?.addEventListener("input", (event) => {
      if (event.target instanceof HTMLTextAreaElement) {
        state.intent = event.target.value;
      }
    });

    shadow.querySelector("[data-action='start-guide']")?.addEventListener("click", startGuide);

    shadow.querySelector("[data-action='choose-backend-api']")?.addEventListener("click", chooseBackendApi);

    shadow.querySelector("[data-action='choose-static-site']")?.addEventListener("click", chooseStaticSite);

    shadow.querySelector("[data-action='confirm-action']")?.addEventListener("click", confirmAction);

    shadow.querySelector("[data-action='complete-guide']")?.addEventListener("click", completeGuide);

    shadow.querySelectorAll("[data-command-action]").forEach((element) => {
      element.addEventListener("click", () => {
        const actionId = element.getAttribute("data-command-action") as CommandActionId | null;
        if (actionId) {
          runCommandAction(actionId);
        }
      });
    });

    if (pendingFocusSelector) {
      const focusTarget = shadow.querySelector<HTMLElement>(pendingFocusSelector);
      pendingFocusSelector = undefined;
      focusTarget?.focus();
    }
  };

  doc.addEventListener("keydown", handleKeyDown);
  shadow.addEventListener("keydown", handleKeyDown as EventListener);
  doc.addEventListener("scroll", refreshCheckedContext, { capture: true, passive: true });
  ownerWindow.addEventListener("scroll", refreshCheckedContext, { passive: true });
  ownerWindow.addEventListener("resize", refreshCheckedContext);
  shellCleanupByHost.set(host, () => {
    doc.removeEventListener("keydown", handleKeyDown);
    shadow.removeEventListener("keydown", handleKeyDown as EventListener);
    doc.removeEventListener("scroll", refreshCheckedContext, { capture: true });
    ownerWindow.removeEventListener("scroll", refreshCheckedContext);
    ownerWindow.removeEventListener("resize", refreshCheckedContext);
    shellCleanupByHost.delete(host);
  });
  render();
  return host;
};

export const unmountMichiInjectedShell = (doc: Document = document) => {
  const host = doc.getElementById(rootId);

  if (!host) {
    return;
  }

  shellCleanupByHost.get(host)?.();
  host.remove();
};
