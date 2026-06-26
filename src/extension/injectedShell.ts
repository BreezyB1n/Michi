import { readCloudflarePageContext } from "./cloudflarePageReader";
import { capabilities, workersGuideSteps } from "../domain/siteSkillPack";
import type { HostPageContext, PageTarget } from "../domain/types";

const rootId = "michi-extension-root";

type ShellLocation = {
  href: string;
  title: string;
};

type ShellState = {
  open: boolean;
  context?: HostPageContext;
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

const primaryTargetForContext = (context: HostPageContext) =>
  preferredTargetByRoute[context.routeId]
    ? context.targets.find((target) => target.id === preferredTargetByRoute[context.routeId])
    : context.targets[0];

export const guideStepForContext = (context: HostPageContext) =>
  workersGuideSteps.find((step) => step.expectedRouteId === context.routeId);

export const recoveryGuidanceForContext = (
  context: HostPageContext
): RecoveryGuidance | undefined => {
  if (context.routeId === "cloudflare.unsupported") {
    return {
      title: "Unsupported page",
      reason: "Michi only reads Cloudflare dashboard pages in this milestone.",
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

const contextCopy = (context: HostPageContext) => {
  const target = primaryTargetForContext(context);
  const signal = context.signals[0];
  const guidance = recoveryGuidanceForContext(context);
  const step = guideStepForContext(context);
  const workersCapability = capabilities["cloudflare-workers"];

  return `
    ${
      step
        ? `<section class="guide-summary" aria-label="Current guide step">
            <div>
              <p class="eyebrow">Capability</p>
              <p class="capability">
                <strong>${escapeHtml(workersCapability.name)}</strong>
                <span>${escapeHtml(workersCapability.concept)}</span>
              </p>
            </div>
            <div>
              <p class="eyebrow">Guide step</p>
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
          </section>`
        : ""
    }
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
  const state: ShellState = { open: false };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Escape" || !state.open) {
      return;
    }

    state.open = false;
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
                  ${state.context ? contextCopy(state.context) : emptyContextCopy}
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
      render();
    });

    shadow.querySelector("[data-action='minimize']")?.addEventListener("click", () => {
      state.open = false;
      render();
    });
  };

  doc.addEventListener("keydown", handleKeyDown);
  render();
  return host;
};
