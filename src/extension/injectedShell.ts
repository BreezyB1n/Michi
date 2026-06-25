import { readCloudflarePageContext } from "./cloudflarePageReader";
import type { HostPageContext } from "../domain/types";

const rootId = "michi-extension-root";

type ShellLocation = {
  href: string;
  title: string;
};

type ShellState = {
  open: boolean;
  context?: HostPageContext;
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

const primaryTargetForContext = (context: HostPageContext) =>
  context.targets.find((target) => target.id === preferredTargetByRoute[context.routeId]) ??
  context.targets[0];

const contextCopy = (context: HostPageContext) => {
  const target = primaryTargetForContext(context);
  const signal = context.signals[0];

  return `
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

  const render = () => {
    shadow.innerHTML = `
      <style>${shellStyles}</style>
      <div class="shell" aria-label="Michi injected shell">
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

  render();
  return host;
};
