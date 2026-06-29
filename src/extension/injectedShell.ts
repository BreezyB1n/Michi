import { readCloudflarePageContext } from "./cloudflarePageReader";
import { capabilities } from "../domain/siteSkillPack";
import {
  canCompleteGuide,
  finalGuideStepIndexForServiceKind,
  guideStepsForServiceKind,
  preferredTargetForContextAndServiceKind,
  preferredTargetIdForRouteId,
  serviceKindForRouteId,
  targetLabelForWorkersGuideTarget
} from "../domain/workersGuideFlow";
import type { WorkersGuideShellPhase } from "../domain/workersGuideFlow";
import type { HostPageContext, PageTarget, ServiceKind } from "../domain/types";
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
};

type RecoveryGuidance = {
  title: string;
  reason: string;
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

const productCapabilityNameForServiceKind = (serviceKind: ServiceKind) =>
  productCapabilityCopy(
    serviceKind === "static-site"
      ? capabilities["cloudflare-pages"]
      : capabilities["cloudflare-workers"]
  ).name;

export const recoveryGuidanceForContext = (
  context: HostPageContext,
  serviceKind: ServiceKind = serviceKindForRouteId(context.routeId) ?? "backend-api"
): RecoveryGuidance | undefined => {
  if (context.routeId === "cloudflare.unsupported") {
    return {
      title: "Unsupported page",
      reason: "Michi only reads supported product pages in this milestone.",
      recoveryAction: "Open a supported workspace page, navigate to the build area, then click Check page again."
    };
  }

  const detectedServiceKind = serviceKindForRouteId(context.routeId);
  if (detectedServiceKind && detectedServiceKind !== serviceKind) {
    return {
      title: "Route mismatch",
      reason: `The active guide is ${productCapabilityNameForServiceKind(
        serviceKind
      )}, but the current page belongs to ${productCapabilityNameForServiceKind(detectedServiceKind)}.`,
      recoveryAction:
        "Return to the selected guide path's expected page, or reset and choose the other path."
    };
  }

  const expectedTargetId = preferredTargetIdForRouteId(context.routeId, serviceKind);

  if (!expectedTargetId || context.targets.some((target) => target.id === expectedTargetId)) {
    return undefined;
  }

  const expectedTargetLabel = productTargetLabel(
    targetLabelForWorkersGuideTarget(expectedTargetId)
  );

  return {
    title: "Target missing",
    reason: `Michi expected ${expectedTargetLabel} on this route, but the page check did not find it.`,
    recoveryAction:
      "Wait for the page to finish loading, return to the expected guide step if needed, then click Check page again."
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

const intentCopy = (intent: string) => `
  <section class="guide-summary" aria-label="Intent entry">
    <div>
      <p class="eyebrow">User intent</p>
      <textarea data-intent aria-label="User intent" rows="4">${escapeHtml(intent)}</textarea>
    </div>
    <button type="button" data-action="start-guide" aria-label="Start guide">Start guide</button>
  </section>
`;

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
    ${guideSummaryCopy(activeStepIndex, {
      canComplete: canCompleteGuide(context, activeStepIndex, resolvedServiceKind),
      serviceKind: resolvedServiceKind
    })}
    ${
      guidance
        ? `<div class="recovery" role="status" aria-label="${escapeHtml(guidance.title)}">
            <p class="recovery-title">${escapeHtml(guidance.title)}</p>
            <p>${escapeHtml(sanitizeProviderText(guidance.reason))}</p>
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
    return intentCopy(state.intent);
  }

  if (state.context?.routeId === "cloudflare.unsupported") {
    return contextCopy(state.context, undefined, state.serviceKind);
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
    phase: "intent"
  };
  const ownerWindow = doc.defaultView ?? window;
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
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Escape" || !state.open) {
      return;
    }

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
                </div>
              </section>`
            : ""
        }
      </div>
    `;

    shadow.querySelector("[data-action='guide']")?.addEventListener("click", () => {
      state.open = true;
      render();
    });

    shadow.querySelector("[data-action='check']")?.addEventListener("click", () => {
      state.open = true;
      state.context = readCloudflarePageContext(doc, currentLocation());
      const nextGuideState = checkedContextFromReducer(state, state.context);
      applyGuideState(nextGuideState);
      render();
    });

    shadow.querySelector("[data-action='minimize']")?.addEventListener("click", () => {
      state.open = false;
      render();
    });

    shadow.querySelector("[data-action='reset-guide']")?.addEventListener("click", () => {
      const nextGuideState = resetGuideFromReducer(state);
      state.open = true;
      state.context = undefined;
      applyGuideState(nextGuideState);
      render();
      shadow.querySelector<HTMLTextAreaElement>("[data-intent]")?.focus();
    });

    shadow.querySelector("[data-action='previous-step']")?.addEventListener("click", () => {
      const nextGuideState = previousStepFromReducer(state);
      applyGuideState(nextGuideState);
      render();
    });

    shadow.querySelector("[data-action='next-step']")?.addEventListener("click", () => {
      const nextGuideState = nextStepFromReducer(state);
      applyGuideState(nextGuideState);
      render();
    });

    shadow.querySelector("[data-intent]")?.addEventListener("input", (event) => {
      if (event.target instanceof HTMLTextAreaElement) {
        state.intent = event.target.value;
      }
    });

    shadow.querySelector("[data-action='start-guide']")?.addEventListener("click", () => {
      const nextGuideState = startGuideFromReducer(state);
      applyGuideState(nextGuideState);
      render();
    });

    shadow.querySelector("[data-action='choose-backend-api']")?.addEventListener("click", () => {
      const nextGuideState = chooseBackendApiFromReducer(state);
      applyGuideState(nextGuideState);
      render();
    });

    shadow.querySelector("[data-action='choose-static-site']")?.addEventListener("click", () => {
      const nextGuideState = chooseStaticSiteFromReducer(state);
      applyGuideState(nextGuideState);
      render();
    });

    shadow.querySelector("[data-action='confirm-action']")?.addEventListener("click", () => {
      const nextGuideState = confirmCriticalActionFromReducer(state);
      applyGuideState(nextGuideState);
      render();
    });

    shadow.querySelector("[data-action='complete-guide']")?.addEventListener("click", () => {
      const nextGuideState = completeGuideFromReducer(
        state,
        canCompleteGuide(state.context, state.activeStepIndex, state.serviceKind ?? "backend-api")
      );
      applyGuideState(nextGuideState);
      render();
    });
  };

  doc.addEventListener("keydown", handleKeyDown);
  doc.addEventListener("scroll", refreshCheckedContext, { capture: true, passive: true });
  ownerWindow.addEventListener("scroll", refreshCheckedContext, { passive: true });
  ownerWindow.addEventListener("resize", refreshCheckedContext);
  shellCleanupByHost.set(host, () => {
    doc.removeEventListener("keydown", handleKeyDown);
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
