import { readCloudflarePageContext } from "./cloudflarePageReader";
import { capabilities, workersGuideSteps } from "../domain/siteSkillPack";
import type { HostPageContext, PageTarget } from "../domain/types";

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
  phase: "intent" | "clarify" | "guide" | "confirm" | "complete" | "static-complete";
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
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
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

  .rail,
  .panel {
    border: 1px solid rgba(23, 23, 23, 0.12);
    background: rgba(255, 255, 255, 0.96);
    box-shadow: 0 18px 42px rgba(15, 23, 42, 0.14);
    backdrop-filter: blur(16px);
  }

  .rail {
    display: grid;
    gap: 6px;
    width: 92px;
    padding: 6px;
    border-radius: 16px;
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
    color: #171717;
  }

  button:hover {
    background: rgba(245, 158, 11, 0.12);
  }

  textarea {
    all: unset;
    box-sizing: border-box;
    width: 100%;
    min-height: 92px;
    padding: 10px;
    border: 1px solid rgba(23, 23, 23, 0.12);
    border-radius: 12px;
    background: rgba(245, 245, 245, 0.78);
    color: #171717;
    font: 550 13px/1.45 inherit;
    resize: vertical;
  }

  .panel {
    width: min(320px, calc(100vw - 84px));
    border-radius: 18px;
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
    border-bottom: 1px solid rgba(23, 23, 23, 0.1);
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
    color: #737373;
    text-transform: uppercase;
  }

  dl {
    display: grid;
    gap: 10px;
  }

  dt {
    margin-bottom: 3px;
    font: 700 10px/1.2 ui-monospace, SFMono-Regular, Menlo, monospace;
    color: #737373;
  }

  dd {
    margin: 0;
    font: 550 13px/1.45 inherit;
    color: #262626;
    overflow-wrap: anywhere;
  }

  .recovery {
    margin-bottom: 12px;
    padding: 12px;
    border: 1px solid rgba(245, 158, 11, 0.36);
    border-radius: 14px;
    background: rgba(255, 251, 235, 0.92);
  }

  .recovery-title {
    margin-bottom: 6px;
    font: 750 13px/1.2 inherit;
    color: #92400e;
  }

  .recovery p {
    font: 550 12px/1.45 inherit;
    color: #713f12;
  }

  .recovery p + p {
    margin-top: 6px;
  }

  .guide-summary {
    display: grid;
    gap: 10px;
    margin-bottom: 14px;
    padding-bottom: 14px;
    border-bottom: 1px solid rgba(23, 23, 23, 0.1);
  }

  .capability {
    display: flex;
    align-items: baseline;
    gap: 8px;
    color: #171717;
  }

  .capability strong {
    font: 750 13px/1.2 inherit;
  }

  .capability span {
    font: 700 10px/1.2 ui-monospace, SFMono-Regular, Menlo, monospace;
    color: #737373;
    text-transform: uppercase;
  }

  .step-title {
    font: 750 15px/1.25 inherit;
    color: #171717;
  }

  .step-toolbar {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .step-toolbar button {
    min-height: 34px;
    border: 1px solid rgba(23, 23, 23, 0.12);
    background: rgba(245, 245, 245, 0.78);
  }

  .step-toolbar button:disabled {
    cursor: not-allowed;
    color: #a3a3a3;
    background: rgba(245, 245, 245, 0.45);
  }

  .target-highlight {
    position: fixed;
    z-index: 2147483646;
    border: 2px solid #f59e0b;
    border-radius: 10px;
    box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.2), 0 16px 36px rgba(15, 23, 42, 0.16);
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

const preferredTargetByRoute: Record<string, string> = {
  "cloudflare.dashboard.home": "workers-pages-nav",
  "cloudflare.workers.overview": "create-worker-button",
  "cloudflare.workers.starter-editor": "starter-handler",
  "cloudflare.workers.deploy-review": "deploy-worker-button",
  "cloudflare.workers.deploy-result": "worker-url"
};

const targetLabelById: Record<string, string> = {
  "workers-pages-nav": "Workers & Pages sidebar item",
  "create-worker-button": "Create Worker button",
  "starter-handler": "Starter request handler",
  "deploy-worker-button": "Deploy button",
  "worker-url": "Worker URL"
};

const finalWorkerStepIndex = workersGuideSteps.length - 1;
const finalWorkerStep = workersGuideSteps[finalWorkerStepIndex];

const primaryTargetForContext = (context: HostPageContext) =>
  preferredTargetByRoute[context.routeId]
    ? context.targets.find((target) => target.id === preferredTargetByRoute[context.routeId])
    : context.targets[0];

export const guideStepForContext = (context: HostPageContext) =>
  workersGuideSteps.find((step) => step.expectedRouteId === context.routeId);

const guideStepIndexForContext = (context: HostPageContext) =>
  workersGuideSteps.findIndex((step) => step.expectedRouteId === context.routeId);

export const recoveryGuidanceForContext = (
  context: HostPageContext
): RecoveryGuidance | undefined => {
  if (context.routeId === "cloudflare.unsupported") {
    return {
      title: "Unsupported page",
      reason: "Michi only reads supported Cloudflare dashboard pages in this milestone.",
      recoveryAction: "Open the Cloudflare dashboard, navigate to Workers & Pages, then click Check page again."
    };
  }

  const expectedTargetId = preferredTargetByRoute[context.routeId];

  if (!expectedTargetId || context.targets.some((target) => target.id === expectedTargetId)) {
    return undefined;
  }

  const expectedTargetLabel = targetLabelById[expectedTargetId] ?? expectedTargetId;

  return {
    title: "Target missing",
    reason: `Michi expected ${expectedTargetLabel} on this route, but the page check did not find it.`,
    recoveryAction:
      "Wait for the Cloudflare page to finish loading, return to the expected guide step if needed, then click Check page again."
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

const highlightCopy = (context: HostPageContext) => {
  const target = primaryTargetForContext(context);
  const style = highlightStyleForTarget(target);

  if (!target || !style) {
    return "";
  }

  return `<div class="target-highlight" data-highlight style="${style}" aria-label="Highlighted target: ${escapeHtml(target.label)}"></div>`;
};

const isWorkerGuideComplete = (
  context: HostPageContext | undefined,
  activeStepIndex: number | undefined
) => {
  if (!context || activeStepIndex !== finalWorkerStepIndex) {
    return false;
  }

  return (
    context.routeId === finalWorkerStep.expectedRouteId &&
    context.targets.some((target) => target.id === finalWorkerStep.targetId) &&
    context.signals.some((signal) => signal.severity === "success")
  );
};

const completionEvidence = (context: HostPageContext | undefined) =>
  context?.signals.find((signal) => signal.severity === "success")?.value ??
  context?.signals[0]?.value ??
  "Worker URL evidence is available.";

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
        <strong>${escapeHtml(capabilities["cloudflare-pages"].name)}</strong>
        <span>${escapeHtml(capabilities["cloudflare-pages"].concept)}</span>
      </p>
    </div>
    <p>${escapeHtml(capabilities["cloudflare-pages"].explanation)}</p>
  </section>
`;

const confirmationCopy = (activeStepIndex: number | undefined) => {
  const step =
    activeStepIndex === undefined || activeStepIndex < 0
      ? undefined
      : workersGuideSteps[activeStepIndex];
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

const completionCopy = (context: HostPageContext | undefined) => {
  const dnsCapability = capabilities["cloudflare-dns"];

  return `<section class="guide-summary" aria-label="Guide completion">
    <div>
      <p class="eyebrow">Primary path complete</p>
      <p class="step-title">Worker URL verified</p>
    </div>
    <p>${escapeHtml(completionEvidence(context))}</p>
    <div>
      <p class="eyebrow">Follow-up route</p>
      <p class="capability">
        <strong>${escapeHtml(dnsCapability.name)}</strong>
        <span>${escapeHtml(dnsCapability.concept)}</span>
      </p>
    </div>
    <p>${escapeHtml(dnsCapability.explanation)}</p>
  </section>`;
};

const guideSummaryCopy = (
  activeStepIndex: number | undefined,
  options: { canComplete?: boolean } = {}
) => {
  if (activeStepIndex === undefined || activeStepIndex < 0) {
    return "";
  }

  const step = workersGuideSteps[activeStepIndex];

  if (!step) {
    return "";
  }

  const workersCapability = capabilities["cloudflare-workers"];
  const canGoPrevious = activeStepIndex > 0;
  const canGoNext = activeStepIndex < workersGuideSteps.length - 1;
  const isFinalStep = activeStepIndex === finalWorkerStepIndex;
  const forwardAction = isFinalStep ? "complete-guide" : "next-step";
  const forwardLabel = isFinalStep ? "Complete guide" : "Next step";
  const forwardDisabled = isFinalStep ? !options.canComplete : !canGoNext;

  return `<section class="guide-summary" aria-label="Current guide step">
    <div>
      <p class="eyebrow">Capability</p>
      <p class="capability">
        <strong>${escapeHtml(workersCapability.name)}</strong>
        <span>${escapeHtml(workersCapability.concept)}</span>
      </p>
    </div>
    <div>
      <p class="eyebrow">Step ${activeStepIndex + 1} / ${workersGuideSteps.length}</p>
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

const contextCopy = (context: HostPageContext, activeStepIndex: number | undefined) => {
  const target = primaryTargetForContext(context);
  const signal = context.signals[0];
  const guidance = recoveryGuidanceForContext(context);

  return `
    ${guideSummaryCopy(activeStepIndex, {
      canComplete: isWorkerGuideComplete(context, activeStepIndex)
    })}
    ${
      guidance
        ? `<div class="recovery" role="status" aria-label="${escapeHtml(guidance.title)}">
            <p class="recovery-title">${escapeHtml(guidance.title)}</p>
            <p>${escapeHtml(guidance.reason)}</p>
            <p>${escapeHtml(guidance.recoveryAction)}</p>
          </div>`
        : ""
    }
    <dl>
      <div>
        <dt>Route</dt>
        <dd>${escapeHtml(context.routeId)}</dd>
      </div>
      <div>
        <dt>Location</dt>
        <dd>${escapeHtml(context.locationLabel)}</dd>
      </div>
      <div>
        <dt>Target</dt>
        <dd>${escapeHtml(target ? target.label : "No target detected")}</dd>
      </div>
      <div>
        <dt>Evidence</dt>
        <dd>${escapeHtml(signal ? signal.label : "No evidence detected")}</dd>
      </div>
    </dl>
  `;
};

const panelBodyCopy = (state: ShellState) => {
  if (state.phase === "intent" && !state.context) {
    return intentCopy(state.intent);
  }

  if (state.context?.routeId === "cloudflare.unsupported") {
    return contextCopy(state.context, undefined);
  }

  if (state.phase === "clarify") {
    return clarificationCopy(state.intent);
  }

  if (state.phase === "static-complete") {
    return staticSiteCopy();
  }

  if (state.phase === "complete") {
    return completionCopy(state.context);
  }

  if (state.phase === "confirm") {
    return confirmationCopy(state.activeStepIndex);
  }

  if (state.context) {
    return contextCopy(state.context, state.activeStepIndex);
  }

  if (state.activeStepIndex !== undefined) {
    return guideSummaryCopy(state.activeStepIndex);
  }

  return emptyContextCopy;
};

export const mountMichiInjectedShell = (
  doc: Document = document,
  location: ShellLocation = {
    href: window.location.href,
    title: document.title
  }
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

    state.context = readCloudflarePageContext(doc, location);
    render();
  };

  const render = () => {
    shadow.innerHTML = `
      <style>${shellStyles}</style>
      <div class="shell" aria-label="Michi injected shell">
        ${state.context ? highlightCopy(state.context) : ""}
        <div class="rail" aria-label="Michi rail">
          <button type="button" data-action="guide" aria-label="Guide">Guide</button>
          <button type="button" data-action="check" aria-label="Check page">Check page</button>
        </div>
        ${
          state.open
            ? `<section data-panel class="panel" aria-label="Michi guide panel">
                <div class="panel-header">
                  <div>
                    <p class="eyebrow">Guide Agent</p>
                    <h2>Michi guide</h2>
                  </div>
                  <button type="button" data-action="minimize" aria-label="Minimize panel">Min</button>
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
      state.context = readCloudflarePageContext(doc, location);
      const nextStepIndex = guideStepIndexForContext(state.context);
      state.activeStepIndex = nextStepIndex >= 0 ? nextStepIndex : undefined;
      if (nextStepIndex >= 0 || state.context.routeId === "cloudflare.unsupported") {
        state.phase = "guide";
      }
      render();
    });

    shadow.querySelector("[data-action='minimize']")?.addEventListener("click", () => {
      state.open = false;
      render();
    });

    shadow.querySelector("[data-action='previous-step']")?.addEventListener("click", () => {
      state.activeStepIndex =
        state.activeStepIndex === undefined ? undefined : Math.max(state.activeStepIndex - 1, 0);
      render();
    });

    shadow.querySelector("[data-action='next-step']")?.addEventListener("click", () => {
      const activeStep =
        state.activeStepIndex === undefined ? undefined : workersGuideSteps[state.activeStepIndex];

      if (activeStep?.criticalAction) {
        state.phase = "confirm";
      } else {
        state.activeStepIndex =
          state.activeStepIndex === undefined
            ? undefined
            : Math.min(state.activeStepIndex + 1, workersGuideSteps.length - 1);
      }
      render();
    });

    shadow.querySelector("[data-intent]")?.addEventListener("input", (event) => {
      if (event.target instanceof HTMLTextAreaElement) {
        state.intent = event.target.value;
      }
    });

    shadow.querySelector("[data-action='start-guide']")?.addEventListener("click", () => {
      state.phase = "clarify";
      render();
    });

    shadow.querySelector("[data-action='choose-backend-api']")?.addEventListener("click", () => {
      state.phase = "guide";
      state.activeStepIndex = 0;
      render();
    });

    shadow.querySelector("[data-action='choose-static-site']")?.addEventListener("click", () => {
      state.phase = "static-complete";
      state.activeStepIndex = undefined;
      render();
    });

    shadow.querySelector("[data-action='confirm-action']")?.addEventListener("click", () => {
      state.phase = "guide";
      state.activeStepIndex =
        state.activeStepIndex === undefined
          ? undefined
          : Math.min(state.activeStepIndex + 1, workersGuideSteps.length - 1);
      render();
    });

    shadow.querySelector("[data-action='complete-guide']")?.addEventListener("click", () => {
      if (isWorkerGuideComplete(state.context, state.activeStepIndex)) {
        state.phase = "complete";
      }
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
