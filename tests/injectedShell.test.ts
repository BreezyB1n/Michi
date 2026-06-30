import { beforeEach, describe, expect, it } from "vitest";
import {
  highlightStyleForTarget,
  mountMichiInjectedShell,
  recoveryGuidanceForContext,
  unmountMichiInjectedShell
} from "../src/extension/injectedShell";
import type { HostPageContext, PageTarget } from "../src/domain/types";

const providerVisibleCopyPattern =
  /\b(?:Cloudflare|Workers|Worker|DNS|Pages|MVP|demo|page context|context status)\b|cloudflare\.|workers\.dev|pages\.dev|dash\.cloudflare|current app|simulat/i;

const expectProductOnlyShadowCopy = (shadow: ShadowRoot | null | undefined) => {
  if (!shadow) {
    throw new Error("Expected shadow root.");
  }

  const accessibleCopy = Array.from(
    shadow.querySelectorAll("[aria-label], [title], [alt], [placeholder]")
  )
    .flatMap((element) =>
      ["aria-label", "title", "alt", "placeholder"].map((attribute) =>
        element.getAttribute(attribute)
      )
    )
    .filter(Boolean)
    .join(" ");

  expect(`${shadow.textContent ?? ""} ${accessibleCopy}`).not.toMatch(providerVisibleCopyPattern);
};

const renderCloudflareFixture = () => {
  document.body.innerHTML = `
    <nav><a href="/workers-and-pages">Workers & Pages</a></nav>
    <main>
      <h1>Workers & Pages</h1>
      <button>Create Worker</button>
    </main>
  `;
};

const renderDeploymentResultFixture = () => {
  document.body.innerHTML = `
    <nav><a href="/workers-and-pages">Workers & Pages</a></nav>
    <main>
      <h1>Deployment complete</h1>
      <p>Your Worker is available at:</p>
      <a href="https://michi-starter.example.workers.dev">https://michi-starter.example.workers.dev</a>
    </main>
  `;
};

const renderStarterEditorFixture = () => {
  document.body.innerHTML = `
    <nav><a href="/workers-and-pages">Workers & Pages</a></nav>
    <main>
      <h1>Worker editor</h1>
      <pre>export default { fetch() { return new Response("ok") } }</pre>
    </main>
  `;
};

const renderPagesOverviewFixture = () => {
  document.body.innerHTML = `
    <nav><a href="/workers-and-pages">Workers & Pages</a></nav>
    <main>
      <h1>Pages projects</h1>
      <button>Create Pages project</button>
    </main>
  `;
};

const renderPagesDeployReviewFixture = () => {
  document.body.innerHTML = `
    <nav><a href="/workers-and-pages">Workers & Pages</a></nav>
    <main>
      <h1>Deploy Pages project</h1>
      <button>Deploy Pages project</button>
    </main>
  `;
};

const renderPagesDeployResultFixture = () => {
  document.body.innerHTML = `
    <nav><a href="/workers-and-pages">Workers & Pages</a></nav>
    <main>
      <h1>Deployment complete</h1>
      <p>Your Pages site is available at:</p>
      <a href="https://michi-static.pages.dev">https://michi-static.pages.dev</a>
    </main>
  `;
};

const renderWorkersOverviewMissingTargetFixture = () => {
  document.body.innerHTML = `
    <nav><a href="/workers-and-pages">Workers & Pages</a></nav>
    <main>
      <h1>Workers & Pages</h1>
      <p>The create action is still loading.</p>
    </main>
  `;
};

const renderUnsupportedAreaFixture = () => {
  document.body.innerHTML = `
    <nav><a href="/workers-and-pages">Workers & Pages</a></nav>
    <main>
      <h1>Analytics</h1>
      <p>Traffic insights for this account.</p>
    </main>
  `;
};

const renderNestedScrollerFixture = () => {
  document.body.innerHTML = `
    <nav><a href="/workers-and-pages">Workers & Pages</a></nav>
    <main>
      <section data-scroll-container style="height: 220px; overflow: auto;">
        <div style="height: 420px; padding-top: 260px;">
          <h1>Workers & Pages</h1>
          <button>Create Worker</button>
        </div>
      </section>
    </main>
  `;
};

const click = (element: Element | null) => {
  if (!element) {
    throw new Error("Expected element to exist before click.");
  }

  element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
};

const input = (element: Element | null, value: string) => {
  if (!(element instanceof HTMLTextAreaElement)) {
    throw new Error("Expected textarea to exist before input.");
  }

  element.value = value;
  element.dispatchEvent(new Event("input", { bubbles: true }));
};

const setElementRect = (
  element: Element,
  rect: { x: number; y: number; width: number; height: number }
) => {
  Object.defineProperty(element, "getBoundingClientRect", {
    configurable: true,
    value: () => ({
      ...rect,
      top: rect.y,
      left: rect.x,
      right: rect.x + rect.width,
      bottom: rect.y + rect.height,
      toJSON: () => rect
    })
  });
};

const hostContext = (overrides: Partial<HostPageContext> = {}): HostPageContext => ({
  url: "https://dash.cloudflare.com/example-account/workers-and-pages",
  title: "Workers & Pages",
  product: "cloudflare",
  locationLabel: "Workers & Pages / Overview",
  routeId: "cloudflare.workers.overview",
  detectedAt: "2026-06-25T00:00:00.000Z",
  targets: [],
  signals: [
    {
      id: "cloudflare.workers.overview-detected",
      label: "Cloudflare route detected",
      value: "cloudflare.workers.overview detected with 0 targets.",
      severity: "warning"
    }
  ],
  ...overrides
});

describe("Injected Michi extension shell", () => {
  beforeEach(() => {
    unmountMichiInjectedShell(document);
  });

  it("mounts once in Shadow DOM with guide and check controls", () => {
    renderCloudflareFixture();

    const first = mountMichiInjectedShell(document);
    const second = mountMichiInjectedShell(document);
    const shadow = first.shadowRoot;

    expect(first).toBe(second);
    expect(document.querySelectorAll("#michi-extension-root")).toHaveLength(1);
    expect(shadow).not.toBeNull();
    expect(shadow?.textContent).toContain("Guide");
    expect(shadow?.textContent).toContain("Check page");
    expect(shadow?.textContent).not.toMatch(/Image|Video/);
  });

  it("unmounts the shell and removes its host", () => {
    renderCloudflareFixture();

    mountMichiInjectedShell(document);
    expect(document.querySelectorAll("#michi-extension-root")).toHaveLength(1);

    unmountMichiInjectedShell(document);

    expect(document.querySelectorAll("#michi-extension-root")).toHaveLength(0);
  });

  it("starts a local guide session from intent and backend clarification", () => {
    renderCloudflareFixture();

    const root = mountMichiInjectedShell(document, {
      href: "https://dash.cloudflare.com/example-account/workers-and-pages",
      title: "Workers & Pages"
    });
    const shadow = root.shadowRoot;

    click(shadow?.querySelector("[data-action='guide']") ?? null);
    expect(shadow?.textContent).toContain("User intent");
    expect(shadow?.textContent).toContain("Start guide");
    expect(shadow?.textContent).toContain("First-run readiness");
    expect(shadow?.textContent).toContain("Panel active");
    expect(shadow?.textContent).toContain("Page needs check");
    expect(shadow?.textContent).toContain("Activity history");
    expect(shadow?.textContent).toContain("No activity yet");

    input(shadow?.querySelector("[data-intent]") ?? null, "Build a JSON API for customers.");
    click(shadow?.querySelector("[data-action='start-guide']") ?? null);
    expect(shadow?.textContent).toContain("What kind of service are you building?");
    expect(shadow?.textContent).toContain("Backend logic or API");
    expect(shadow?.textContent).toContain("Intent captured");

    click(shadow?.querySelector("[data-action='choose-backend-api']") ?? null);
    expect(shadow?.textContent).toContain("Service runtime");
    expect(shadow?.textContent).toContain("Step 1 / 5");
    expect(shadow?.textContent).toContain("Find the build area");
    expect(shadow?.textContent).toContain("Open the build area from the current page navigation.");
    expect(shadow?.textContent).toContain("Service path selected");
    expectProductOnlyShadowCopy(shadow);
  });

  it("hides first-run readiness after Check starts a guide", () => {
    renderCloudflareFixture();

    const root = mountMichiInjectedShell(document, {
      href: "https://dash.cloudflare.com/example-account/workers-and-pages",
      title: "Workers & Pages"
    });
    const shadow = root.shadowRoot;

    click(shadow?.querySelector("[data-action='guide']") ?? null);
    expect(shadow?.textContent).toContain("Page needs check");

    click(shadow?.querySelector("[data-action='check']") ?? null);
    expect(shadow?.textContent).not.toContain("First-run readiness");
    expect(shadow?.textContent).toContain("Step 2 / 5");
    expect(shadow?.textContent).toContain("Create a service");
    expectProductOnlyShadowCopy(shadow);
  });

  it("shows first-run readiness warning for checked unsupported recovery", () => {
    renderUnsupportedAreaFixture();

    const root = mountMichiInjectedShell(document, {
      href: "https://dash.cloudflare.com/example-account/analytics",
      title: "Analytics"
    });
    const shadow = root.shadowRoot;

    click(shadow?.querySelector("[data-action='guide']") ?? null);
    expect(shadow?.textContent).toContain("Page needs check");

    click(shadow?.querySelector("[data-action='check']") ?? null);

    expect(shadow?.textContent).toContain("First-run readiness");
    expect(shadow?.textContent).toContain("Page needs recovery");
    expect(shadow?.textContent).toContain("Recover the current page state");
    expect(shadow?.textContent).toContain("Unsupported page");
    expect(shadow?.textContent).toContain("Open a supported workspace page");
    expect(shadow?.textContent).not.toContain("Step 1 / 5");
    expect(shadow?.querySelector("[data-action='next-step']")).toBeNull();
    expectProductOnlyShadowCopy(shadow);
  });

  it("renders command handoff and routes commands through existing shell actions", () => {
    renderCloudflareFixture();

    const root = mountMichiInjectedShell(document);
    const shadow = root.shadowRoot;

    click(shadow?.querySelector("[data-action='guide']") ?? null);
    expect(shadow?.textContent).toContain("Command handoff");
    expect(shadow?.textContent).toContain("Ready for an intent");
    expect(shadow?.textContent).toContain("Start from intent");

    click(shadow?.querySelector("[data-command-action='start-guide']") ?? null);
    expect(shadow?.textContent).toContain("Choose a guide path");

    click(shadow?.querySelector("[data-command-action='choose-static-site']") ?? null);
    expect(shadow?.textContent).toContain("Site publishing");
    expect(shadow?.textContent).toContain("Next step is ready");

    click(shadow?.querySelector("[data-command-action='advance-guide']") ?? null);
    expect(shadow?.textContent).toContain("Step 2 / 5");
    expect(shadow?.textContent).toContain("Create a site");
    expectProductOnlyShadowCopy(shadow);
  });

  it("does not expose unsafe command handoff progress during confirmation or recovery", () => {
    renderCloudflareFixture();

    const root = mountMichiInjectedShell(document, {
      href: "https://dash.cloudflare.com/example-account/workers-and-pages",
      title: "Workers & Pages"
    });
    const shadow = root.shadowRoot;

    click(shadow?.querySelector("[data-action='check']") ?? null);
    click(shadow?.querySelector("[data-command-action='advance-guide']") ?? null);

    expect(shadow?.textContent).toContain("User confirmation needed");
    expect(shadow?.textContent).toContain("Confirm now");
    expect(shadow?.querySelector("[data-command-action='advance-guide']")).toBeNull();
    expect(shadow?.querySelector("[data-command-action='complete-guide']")).toBeNull();

    renderWorkersOverviewMissingTargetFixture();
    click(shadow?.querySelector("[data-action='check']") ?? null);

    expect(shadow?.textContent).toContain("Recovery is required");
    expect(shadow?.textContent).toContain("Recover now");
    expect(shadow?.querySelector(".command-handoff")?.textContent).toContain(
      "Wait for the page to finish loading"
    );
    expect(shadow?.querySelector("[aria-label='Activity history']")?.textContent).toContain(
      "Expected control missing: Wait for the page to finish loading or return to the expected step, then choose Recover now."
    );
    expect(shadow?.querySelector("[aria-label='Activity history']")?.textContent).not.toContain(
      "Michi paused this guide and surfaced a recovery step"
    );
    expect(shadow?.querySelector("[data-action='previous-step']")).toBeNull();
    expect(shadow?.querySelector("[data-action='next-step']")).toBeNull();
    expect(shadow?.querySelector("[data-action='complete-guide']")).toBeNull();
    expect(shadow?.querySelector("[data-command-action='advance-guide']")).toBeNull();
    expect(shadow?.querySelector("[data-command-action='complete-guide']")).toBeNull();
    expectProductOnlyShadowCopy(shadow);
  });

  it("routes static website clarification to the site publishing guide", () => {
    renderCloudflareFixture();

    const root = mountMichiInjectedShell(document);
    const shadow = root.shadowRoot;

    click(shadow?.querySelector("[data-action='guide']") ?? null);
    input(shadow?.querySelector("[data-intent]") ?? null, "Publish a landing page.");
    click(shadow?.querySelector("[data-action='start-guide']") ?? null);
    click(shadow?.querySelector("[data-action='choose-static-site']") ?? null);

    expect(shadow?.textContent).toContain("Site publishing");
    expect(shadow?.textContent).toContain("Static web path");
    expect(shadow?.textContent).toContain("Step 1 / 5");
    expect(shadow?.textContent).toContain("Find the build area");
    expect(shadow?.textContent).toContain("Open the build area from the current page navigation.");
    expectProductOnlyShadowCopy(shadow);
  });

  it("checks and advances through Pages deploy confirmation", () => {
    renderPagesOverviewFixture();

    const location = {
      href: "https://dash.cloudflare.com/example-account/pages",
      title: "Pages"
    };
    const root = mountMichiInjectedShell(document, location);
    const shadow = root.shadowRoot;

    click(shadow?.querySelector("[data-action='guide']") ?? null);
    click(shadow?.querySelector("[data-action='start-guide']") ?? null);
    click(shadow?.querySelector("[data-action='choose-static-site']") ?? null);
    click(shadow?.querySelector("[data-action='check']") ?? null);

    expect(shadow?.textContent).toContain("Site publishing overview");
    expect(shadow?.textContent).toContain("Step 2 / 5");
    expect(shadow?.textContent).toContain("Create a site");
    expect(shadow?.textContent).toContain("Create site button");

    click(shadow?.querySelector("[data-action='next-step']") ?? null);
    click(shadow?.querySelector("[data-action='next-step']") ?? null);

    renderPagesDeployReviewFixture();
    location.href = "https://dash.cloudflare.com/example-account/pages/deploy-review";
    location.title = "Deploy Pages project";
    click(shadow?.querySelector("[data-action='check']") ?? null);
    expect(shadow?.textContent).toContain("Step 4 / 5");
    expect(shadow?.textContent).toContain("Deploy the site");
    expect(shadow?.textContent).toContain("Deploy site button");

    click(shadow?.querySelector("[data-action='next-step']") ?? null);
    expect(shadow?.textContent).toContain("Confirm Deploy site");
    expect(shadow?.textContent).toContain("Publishes the site project to a reachable URL");
  });

  it("shows route-mismatch recovery when a Pages guide checks a Workers route", () => {
    renderPagesOverviewFixture();

    const location = {
      href: "https://dash.cloudflare.com/example-account/pages",
      title: "Pages"
    };
    const root = mountMichiInjectedShell(document, location);
    const shadow = root.shadowRoot;

    click(shadow?.querySelector("[data-action='guide']") ?? null);
    click(shadow?.querySelector("[data-action='start-guide']") ?? null);
    click(shadow?.querySelector("[data-action='choose-static-site']") ?? null);
    click(shadow?.querySelector("[data-action='check']") ?? null);
    expect(shadow?.textContent).toContain("Create a site");

    renderCloudflareFixture();
    const createWorkerButton = document.querySelector("button");
    if (!createWorkerButton) {
      throw new Error("Expected Worker create button.");
    }
    setElementRect(createWorkerButton, { x: 32, y: 88, width: 144, height: 42 });
    location.href = "https://dash.cloudflare.com/example-account/workers-and-pages";
    location.title = "Workers & Pages";
    click(shadow?.querySelector("[data-action='check']") ?? null);

    expect(shadow?.textContent).toContain("Wrong guide area");
    expect(shadow?.textContent).toContain("active guide is Site publishing");
    expect(shadow?.textContent).toContain("checked page looks like Service runtime");
    expect(shadow?.textContent).toContain("Michi keeps the current guide selected");
    expect(shadow?.textContent).toContain("Return to the Site publishing path");
    expect(shadow?.querySelector("[data-highlight]")).toBeNull();
    expect(shadow?.textContent).not.toContain("Create a service");

    renderPagesDeployReviewFixture();
    location.href = "https://dash.cloudflare.com/example-account/pages/deploy-review";
    location.title = "Deploy Pages project";
    click(shadow?.querySelector("[data-action='check']") ?? null);

    expect(shadow?.textContent).toContain("Step 4 / 5");
    expect(shadow?.textContent).toContain("Deploy the site");
    expect(shadow?.querySelector(".recovery")?.textContent ?? "").not.toContain("Wrong guide area");
  });

  it("shows route-mismatch recovery over stale Pages confirmation copy", () => {
    renderPagesDeployReviewFixture();

    const location = {
      href: "https://dash.cloudflare.com/example-account/pages/deploy-review",
      title: "Deploy Pages project"
    };
    const root = mountMichiInjectedShell(document, location);
    const shadow = root.shadowRoot;

    click(shadow?.querySelector("[data-action='guide']") ?? null);
    click(shadow?.querySelector("[data-action='start-guide']") ?? null);
    click(shadow?.querySelector("[data-action='choose-static-site']") ?? null);
    click(shadow?.querySelector("[data-action='check']") ?? null);
    click(shadow?.querySelector("[data-action='next-step']") ?? null);
    expect(shadow?.textContent).toContain("Confirm Deploy site");

    renderCloudflareFixture();
    location.href = "https://dash.cloudflare.com/example-account/workers-and-pages";
    location.title = "Workers & Pages";
    click(shadow?.querySelector("[data-action='check']") ?? null);

    expect(shadow?.textContent).toContain("Wrong guide area");
    expect(shadow?.textContent).toContain("active guide is Site publishing");
    expect(shadow?.textContent).toContain("checked page looks like Service runtime");
    expect(shadow?.textContent).toContain("Michi keeps the current guide selected");
    expect(shadow?.textContent).not.toContain("Confirm Deploy site");
    expect(shadow?.textContent).not.toContain("Publishes the site project to a reachable URL");
  });

  it("completes the static-site guide with custom-domain follow-up after site URL evidence", () => {
    renderPagesDeployResultFixture();

    const root = mountMichiInjectedShell(document, {
      href: "https://dash.cloudflare.com/example-account/pages/deploy-result",
      title: "Deployment complete"
    });
    const shadow = root.shadowRoot;

    click(shadow?.querySelector("[data-action='guide']") ?? null);
    click(shadow?.querySelector("[data-action='start-guide']") ?? null);
    click(shadow?.querySelector("[data-action='choose-static-site']") ?? null);
    click(shadow?.querySelector("[data-action='check']") ?? null);
    expect(shadow?.textContent).toContain("Step 5 / 5");
    expect(shadow?.textContent).toContain("Verify the site URL");
    expect(shadow?.textContent).toContain("site URL detected");

    click(shadow?.querySelector("[data-action='complete-guide']") ?? null);

    expect(shadow?.textContent).toContain("Primary path complete");
    expect(shadow?.textContent).toContain("Site URL verified");
    expect(shadow?.textContent).toContain("generated site URL is visible on the page.");
    expect(shadow?.textContent).not.toContain("michi-static.pages.dev");
    expect(shadow?.textContent).toContain("Custom domain");
  });

  it("opens, checks page context, and minimizes", () => {
    renderCloudflareFixture();

    const root = mountMichiInjectedShell(document, {
      href: "https://dash.cloudflare.com/example-account/workers-and-pages",
      title: "Workers & Pages"
    });
    const shadow = root.shadowRoot;

    click(shadow?.querySelector("[data-action='guide']") ?? null);
    expect(shadow?.textContent).toContain("Michi side panel");
    expect(shadow?.textContent).toContain("User intent");

    click(shadow?.querySelector("[data-action='check']") ?? null);
    expect(shadow?.textContent).toContain("Service runtime overview");
    expect(shadow?.textContent).toContain("Create service button");
    expect(shadow?.textContent).toContain("Product route detected");
    expect(shadow?.textContent).toContain("Service runtime");
    expect(shadow?.textContent).toContain("Step 2 / 5");
    expect(shadow?.textContent).toContain("Create a service");
    expect(shadow?.textContent).toContain("Choose the create action and keep the generated starter service.");
    expect(shadow?.textContent).toContain("A service draft exists and the editor or setup view is visible.");
    expectProductOnlyShadowCopy(shadow);

    click(shadow?.querySelector("[data-action='minimize']") ?? null);
    expect(shadow?.querySelector("[data-panel]")).toBeNull();
  });

  it("renders a target callout with the checked highlight", () => {
    renderCloudflareFixture();
    const createButton = document.querySelector("button");
    if (!createButton) {
      throw new Error("Expected fixture create button.");
    }
    setElementRect(createButton, { x: 760, y: 40, width: 96, height: 34 });

    const root = mountMichiInjectedShell(document, {
      href: "https://dash.cloudflare.com/example-account/workers-and-pages",
      title: "Workers & Pages"
    });
    const shadow = root.shadowRoot;

    click(shadow?.querySelector("[data-action='check']") ?? null);

    const callout = shadow?.querySelector("[data-target-callout]");
    expect(callout).not.toBeNull();
    expect(callout?.getAttribute("aria-label")).toBe(
      "Michi target callout: Create service button"
    );
    expect(callout?.textContent).toContain("Create service button");
    expect(callout?.textContent).toContain(
      "Michi is checking this target for the active guide step."
    );
    expect(callout?.getAttribute("style")).toContain("width: 220px");
    expectProductOnlyShadowCopy(shadow);
  });

  it("navigates guide steps locally after checking the page", () => {
    renderCloudflareFixture();

    const root = mountMichiInjectedShell(document, {
      href: "https://dash.cloudflare.com/example-account/workers-and-pages",
      title: "Workers & Pages"
    });
    const shadow = root.shadowRoot;

    click(shadow?.querySelector("[data-action='check']") ?? null);
    expect(shadow?.textContent).toContain("Step 2 / 5");
    expect(shadow?.textContent).toContain("Create a service");

    click(shadow?.querySelector("[data-action='next-step']") ?? null);
    expect(shadow?.textContent).toContain("Confirm Create service");

    click(shadow?.querySelector("[data-action='confirm-action']") ?? null);
    expect(shadow?.textContent).toContain("Step 3 / 5");
    expect(shadow?.textContent).toContain("Review the starter response");
    expect(shadow?.textContent).toContain("Read the starter handler and keep the default response for this guide.");

    click(shadow?.querySelector("[data-action='previous-step']") ?? null);
    expect(shadow?.textContent).toContain("Step 2 / 5");
    expect(shadow?.textContent).toContain("Create a service");
  });

  it("requires confirmation before advancing past a critical guide step", () => {
    renderCloudflareFixture();

    const root = mountMichiInjectedShell(document, {
      href: "https://dash.cloudflare.com/example-account/workers-and-pages",
      title: "Workers & Pages"
    });
    const shadow = root.shadowRoot;

    click(shadow?.querySelector("[data-action='check']") ?? null);
    expect(shadow?.textContent).toContain("Step 2 / 5");
    expect(shadow?.textContent).toContain("Create a service");
    expect(shadow?.textContent).toContain("Page check synced");

    click(shadow?.querySelector("[data-action='next-step']") ?? null);
    expect(shadow?.textContent).toContain("Critical write action");
    expect(shadow?.textContent).toContain("Confirm Create service");
    expect(shadow?.textContent).toContain("Prepares a new service resource");
    expect(shadow?.textContent).not.toContain("Step 3 / 5");
    expect(shadow?.textContent).toContain("Confirmation needed");
    expect(shadow?.textContent).not.toContain("Action confirmed");
    expectProductOnlyShadowCopy(shadow);

    click(shadow?.querySelector("[data-action='confirm-action']") ?? null);
    expect(shadow?.textContent).toContain("Step 3 / 5");
    expect(shadow?.textContent).toContain("Review the starter response");
    expect(shadow?.textContent).toContain("Action confirmed");
  });

  it("does not re-anchor pending confirmation when checking a later route", () => {
    renderCloudflareFixture();
    const location = {
      href: "https://dash.cloudflare.com/example-account/workers-and-pages",
      title: "Workers & Pages"
    };
    const root = mountMichiInjectedShell(document, location);
    const shadow = root.shadowRoot;

    click(shadow?.querySelector("[data-action='check']") ?? null);
    click(shadow?.querySelector("[data-action='next-step']") ?? null);
    expect(shadow?.textContent).toContain("Confirm Create service");

    renderStarterEditorFixture();
    location.href = "https://dash.cloudflare.com/example-account/workers/services/edit/michi-starter";
    location.title = "Worker editor";
    click(shadow?.querySelector("[data-action='check']") ?? null);

    expect(shadow?.textContent).toContain("Confirm Create service");
    expect(shadow?.textContent).toContain("Prepares a new service resource");
    expect(shadow?.textContent).not.toContain("Step 3 / 5");
    expect(shadow?.textContent).not.toContain("Review the starter response");
    expectProductOnlyShadowCopy(shadow);
  });

  it("shows target-missing recovery over stale confirmation copy", () => {
    renderCloudflareFixture();
    const location = {
      href: "https://dash.cloudflare.com/example-account/workers-and-pages",
      title: "Workers & Pages"
    };
    const root = mountMichiInjectedShell(document, location);
    const shadow = root.shadowRoot;

    click(shadow?.querySelector("[data-action='check']") ?? null);
    click(shadow?.querySelector("[data-action='next-step']") ?? null);
    expect(shadow?.textContent).toContain("Confirm Create service");

    renderWorkersOverviewMissingTargetFixture();
    click(shadow?.querySelector("[data-action='check']") ?? null);

    expect(shadow?.textContent).toContain("Expected control missing");
    expect(shadow?.textContent).toContain("Create service button");
    expect(shadow?.textContent).toContain("Michi cannot safely anchor this step");
    expect(shadow?.querySelector("[data-target-callout]")).toBeNull();
    expect(shadow?.textContent).not.toContain("Confirm Create service");
    expect(shadow?.textContent).not.toContain("Prepares a new service resource");
    expectProductOnlyShadowCopy(shadow);
  });

  it("completes the service guide with custom-domain follow-up after service URL evidence", () => {
    renderDeploymentResultFixture();

    const root = mountMichiInjectedShell(document, {
      href: "https://dash.cloudflare.com/example-account/workers/services/view/michi-starter/deployments",
      title: "Deployment complete"
    });
    const shadow = root.shadowRoot;

    click(shadow?.querySelector("[data-action='check']") ?? null);
    expect(shadow?.textContent).toContain("Step 5 / 5");
    expect(shadow?.textContent).toContain("Verify the service URL");
    expect(shadow?.textContent).toContain("service URL detected");
    expect(shadow?.textContent).toContain("Complete guide");

    click(shadow?.querySelector("[data-action='complete-guide']") ?? null);
    expect(shadow?.textContent).toContain("Primary path complete");
    expect(shadow?.textContent).toContain("Service URL verified");
    expect(shadow?.textContent).toContain("generated service URL is visible on the page.");
    expect(shadow?.textContent).not.toContain("michi-starter.example.workers.dev");
    expect(shadow?.textContent).toContain("Follow-up route");
    expect(shadow?.textContent).toContain("Custom domain");
    expect(shadow?.textContent).toContain("Routing follow-up");
    expectProductOnlyShadowCopy(shadow);
  });

  it("resets a completed guide to intent entry and clears page evidence", () => {
    renderDeploymentResultFixture();
    const workerUrl = document.querySelector("a[href*='workers.dev']");
    if (!workerUrl) {
      throw new Error("Expected Worker URL fixture link.");
    }
    setElementRect(workerUrl, { x: 42, y: 88, width: 220, height: 24 });

    const root = mountMichiInjectedShell(document, {
      href: "https://dash.cloudflare.com/example-account/workers/services/view/michi-starter/deployments",
      title: "Deployment complete"
    });
    const shadow = root.shadowRoot;

    click(shadow?.querySelector("[data-action='check']") ?? null);
    click(shadow?.querySelector("[data-action='complete-guide']") ?? null);
    expect(shadow?.textContent).toContain("Primary path complete");
    expect(shadow?.textContent).toContain("Completion evidence passed");
    expect(shadow?.querySelector("[data-highlight]")).not.toBeNull();
    expect(shadow?.querySelector(".rail [data-action='reset-guide']")).toBeNull();

    click(shadow?.querySelector("[data-action='reset-guide']") ?? null);

    expect(shadow?.querySelector("[data-panel]")).not.toBeNull();
    expect(shadow?.textContent).toContain("User intent");
    expect(shadow?.textContent).toContain("Start guide");
    expect(shadow?.textContent).not.toContain("Primary path complete");
    expect(shadow?.textContent).not.toContain("Custom domain");
    expect(shadow?.textContent).not.toContain("Deployment result");
    expect(shadow?.textContent).toContain("Session reset");
    expect(shadow?.textContent).not.toContain("Completion evidence passed");
    expect(shadow?.querySelector("[data-highlight]")).toBeNull();
  });

  it("resets an active guide step back to the intent entry", () => {
    renderCloudflareFixture();

    const root = mountMichiInjectedShell(document);
    const shadow = root.shadowRoot;

    click(shadow?.querySelector("[data-action='guide']") ?? null);
    click(shadow?.querySelector("[data-action='start-guide']") ?? null);
    click(shadow?.querySelector("[data-action='choose-backend-api']") ?? null);
    expect(shadow?.textContent).toContain("Step 1 / 5");

    click(shadow?.querySelector("[data-action='reset-guide']") ?? null);

    expect(shadow?.textContent).toContain("User intent");
    expect(shadow?.textContent).toContain("Start guide");
    expect(shadow?.textContent).not.toContain("Step 1 / 5");
    expect(shadow?.textContent).not.toContain("Find the build area");
  });

  it("resets a critical confirmation back to the intent entry", () => {
    renderCloudflareFixture();

    const root = mountMichiInjectedShell(document, {
      href: "https://dash.cloudflare.com/example-account/workers-and-pages",
      title: "Workers & Pages"
    });
    const shadow = root.shadowRoot;

    click(shadow?.querySelector("[data-action='check']") ?? null);
    click(shadow?.querySelector("[data-action='next-step']") ?? null);
    expect(shadow?.textContent).toContain("Confirm Create service");

    click(shadow?.querySelector("[data-action='reset-guide']") ?? null);

    expect(shadow?.textContent).toContain("User intent");
    expect(shadow?.textContent).toContain("Start guide");
    expect(shadow?.textContent).not.toContain("Confirm Create service");
    expect(shadow?.textContent).not.toContain("Critical write action");
  });

  it("resets a static-site guide back to the intent entry", () => {
    renderCloudflareFixture();

    const root = mountMichiInjectedShell(document);
    const shadow = root.shadowRoot;

    click(shadow?.querySelector("[data-action='guide']") ?? null);
    click(shadow?.querySelector("[data-action='start-guide']") ?? null);
    click(shadow?.querySelector("[data-action='choose-static-site']") ?? null);
    expect(shadow?.textContent).toContain("Site publishing");

    click(shadow?.querySelector("[data-action='reset-guide']") ?? null);

    expect(shadow?.textContent).toContain("User intent");
    expect(shadow?.textContent).toContain("Start guide");
    expect(shadow?.textContent).not.toContain("Site publishing");
    expect(shadow?.textContent).not.toContain("Find the build area");
  });

  it("moves focus to the intent input after reset", () => {
    renderCloudflareFixture();

    const root = mountMichiInjectedShell(document);
    const shadow = root.shadowRoot;

    click(shadow?.querySelector("[data-action='guide']") ?? null);
    click(shadow?.querySelector("[data-action='start-guide']") ?? null);
    const resetButton = shadow?.querySelector("[data-action='reset-guide']");
    if (!(resetButton instanceof HTMLButtonElement)) {
      throw new Error("Expected reset button.");
    }

    resetButton.focus();
    click(resetButton);

    expect(shadow?.activeElement).toBe(shadow?.querySelector("[data-intent]"));
  });

  it("resets recovery guidance back to the intent entry", () => {
    renderWorkersOverviewMissingTargetFixture();

    const root = mountMichiInjectedShell(document, {
      href: "https://dash.cloudflare.com/example-account/workers-and-pages/missing-target",
      title: "Workers & Pages"
    });
    const shadow = root.shadowRoot;

    click(shadow?.querySelector("[data-action='check']") ?? null);
    expect(shadow?.textContent).toContain("Expected control missing");

    click(shadow?.querySelector("[data-action='reset-guide']") ?? null);

    expect(shadow?.textContent).toContain("User intent");
    expect(shadow?.textContent).toContain("Start guide");
    expect(shadow?.textContent).not.toContain("Expected control missing");
    expect(shadow?.textContent).not.toContain("cloudflare.workers.overview");
  });

  it("does not complete from local final-step navigation without service URL evidence", () => {
    renderCloudflareFixture();

    const root = mountMichiInjectedShell(document);
    const shadow = root.shadowRoot;

    click(shadow?.querySelector("[data-action='guide']") ?? null);
    click(shadow?.querySelector("[data-action='start-guide']") ?? null);
    click(shadow?.querySelector("[data-action='choose-backend-api']") ?? null);
    click(shadow?.querySelector("[data-action='next-step']") ?? null);
    click(shadow?.querySelector("[data-action='next-step']") ?? null);
    click(shadow?.querySelector("[data-action='confirm-action']") ?? null);
    click(shadow?.querySelector("[data-action='next-step']") ?? null);
    click(shadow?.querySelector("[data-action='next-step']") ?? null);
    click(shadow?.querySelector("[data-action='confirm-action']") ?? null);

    expect(shadow?.textContent).toContain("Step 5 / 5");
    expect(shadow?.textContent).toContain("Verify the service URL");
    const completeButton = shadow?.querySelector("[data-action='complete-guide']");
    expect(completeButton).toBeInstanceOf(HTMLButtonElement);
    expect((completeButton as HTMLButtonElement | null)?.disabled).toBe(true);
    expect(shadow?.querySelector("[data-command-action='complete-guide']")).toBeNull();
    expect(shadow?.textContent).not.toContain("Finish guide");

    click(completeButton ?? null);
    expect(shadow?.textContent).not.toContain("Primary path complete");
    expect(shadow?.textContent).not.toContain("Service URL verified");
  });

  it("collapses with Escape without clearing checked context", () => {
    renderCloudflareFixture();

    const root = mountMichiInjectedShell(document, {
      href: "https://dash.cloudflare.com/example-account/workers-and-pages",
      title: "Workers & Pages"
    });
    const shadow = root.shadowRoot;

    click(shadow?.querySelector("[data-action='guide']") ?? null);
    click(shadow?.querySelector("[data-action='check']") ?? null);
    expect(shadow?.textContent).toContain("Service runtime overview");

    click(shadow?.querySelector("[data-action='next-step']") ?? null);
    expect(shadow?.textContent).toContain("Confirm Create service");
    click(shadow?.querySelector("[data-action='confirm-action']") ?? null);
    expect(shadow?.textContent).toContain("Step 3 / 5");
    click(shadow?.querySelector("[data-action='previous-step']") ?? null);
    expect(shadow?.textContent).toContain("Step 2 / 5");
    expect(shadow?.activeElement).toBe(shadow?.querySelector("[data-primary-panel-focus]"));

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(shadow?.querySelector("[data-panel]")).toBeNull();
    expect(shadow?.activeElement).toBe(shadow?.querySelector("[data-action='guide']"));

    click(shadow?.querySelector("[data-action='guide']") ?? null);
    expect(shadow?.textContent).toContain("Service runtime overview");

    shadow?.querySelector("[data-command-action='advance-guide']")?.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true, composed: true })
    );
    expect(shadow?.querySelector("[data-panel]")).toBeNull();

    click(shadow?.querySelector("[data-action='guide']") ?? null);
    expect(shadow?.textContent).toContain("Service runtime overview");
    expect(shadow?.textContent).toContain("Create service button");
  });

  it("restores focus across open, minimize, Escape, and reset", () => {
    renderCloudflareFixture();

    const root = mountMichiInjectedShell(document, {
      href: "https://dash.cloudflare.com/example-account/workers-and-pages",
      title: "Workers & Pages"
    });
    const shadow = root.shadowRoot;
    const guideButton = shadow?.querySelector<HTMLButtonElement>("[data-action='guide']");

    expect(Array.from(shadow?.querySelectorAll(".rail button") ?? []).map((button) => button.textContent)).toEqual([
      "Guide",
      "Check page"
    ]);

    guideButton?.focus();
    click(guideButton ?? null);
    expect(shadow?.activeElement).toBe(shadow?.querySelector("[data-intent]"));

    const hostCreateButton = document.querySelector("main button");
    hostCreateButton?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(shadow?.querySelector("[data-panel]")).toBeInstanceOf(HTMLElement);

    const preventedEscape = new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
      cancelable: true,
      composed: true
    });
    preventedEscape.preventDefault();
    shadow?.querySelector("[data-intent]")?.dispatchEvent(preventedEscape);
    expect(shadow?.querySelector("[data-panel]")).toBeInstanceOf(HTMLElement);

    const minimizeButton = shadow?.querySelector<HTMLButtonElement>("[data-action='minimize']");
    minimizeButton?.focus();
    click(minimizeButton ?? null);
    expect(shadow?.querySelector("[data-panel]")).toBeNull();
    expect(shadow?.activeElement).toBe(shadow?.querySelector("[data-action='guide']"));

    click(shadow?.querySelector("[data-action='guide']") ?? null);
    click(shadow?.querySelector("[data-action='check']") ?? null);
    expect(shadow?.textContent).toContain("Service runtime overview");

    shadow?.querySelector("[data-command-action='advance-guide']")?.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true, composed: true })
    );
    expect(shadow?.querySelector("[data-panel]")).toBeNull();
    expect(shadow?.activeElement).toBe(shadow?.querySelector("[data-action='guide']"));

    click(shadow?.querySelector("[data-action='guide']") ?? null);
    click(shadow?.querySelector("[data-action='reset-guide']") ?? null);
    expect(shadow?.activeElement).toBe(shadow?.querySelector("[data-intent]"));
  });

  it("creates target highlight styles only when a bounding box exists", () => {
    const target: PageTarget = {
      id: "create-worker-button",
      label: "Create Worker button",
      role: "button",
      text: "Create Worker",
      confidence: "high",
      boundingBox: { x: 10, y: 20, width: 120, height: 40 }
    };

    expect(highlightStyleForTarget(target)).toContain("left: 8px");
    expect(highlightStyleForTarget(target)).toContain("top: 18px");
    expect(highlightStyleForTarget({ ...target, boundingBox: undefined })).toBeUndefined();
  });

  it("refreshes target highlight coordinates after scrolling a checked page", () => {
    renderCloudflareFixture();
    const createButton = document.querySelector("button");
    if (!createButton) {
      throw new Error("Expected fixture create button.");
    }
    setElementRect(createButton, { x: 20, y: 40, width: 144, height: 42 });

    const root = mountMichiInjectedShell(document, {
      href: "https://dash.cloudflare.com/example-account/workers-and-pages",
      title: "Workers & Pages"
    });
    const shadow = root.shadowRoot;

    click(shadow?.querySelector("[data-action='check']") ?? null);
    expect(shadow?.querySelector("[data-highlight]")?.getAttribute("style")).toContain("top: 38px");
    expect(shadow?.querySelector("[data-target-callout]")?.getAttribute("style")).toContain("top: 92px");

    setElementRect(createButton, { x: 20, y: 96, width: 144, height: 42 });
    window.dispatchEvent(new Event("scroll"));

    expect(shadow?.querySelector("[data-highlight]")?.getAttribute("style")).toContain("top: 94px");
    expect(shadow?.querySelector("[data-target-callout]")?.getAttribute("style")).toContain("top: 148px");
    expect(shadow?.textContent).toContain("Service runtime overview");
    expect(shadow?.textContent).toContain("Step 2 / 5");
  });

  it("refreshes target highlight coordinates after scrolling a nested container", () => {
    renderNestedScrollerFixture();
    const createButton = document.querySelector("button");
    const scroller = document.querySelector("[data-scroll-container]");
    if (!createButton || !scroller) {
      throw new Error("Expected nested scrolling fixture.");
    }
    setElementRect(createButton, { x: 32, y: 260, width: 144, height: 42 });

    const root = mountMichiInjectedShell(document, {
      href: "https://dash.cloudflare.com/example-account/workers-and-pages",
      title: "Workers & Pages"
    });
    const shadow = root.shadowRoot;

    click(shadow?.querySelector("[data-action='check']") ?? null);
    expect(shadow?.querySelector("[data-highlight]")?.getAttribute("style")).toContain("top: 258px");
    expect(shadow?.querySelector("[data-target-callout]")?.getAttribute("style")).toContain("top: 312px");

    setElementRect(createButton, { x: 32, y: 156, width: 144, height: 42 });
    scroller.dispatchEvent(new Event("scroll"));

    expect(shadow?.querySelector("[data-highlight]")?.getAttribute("style")).toContain("top: 154px");
    expect(shadow?.querySelector("[data-target-callout]")?.getAttribute("style")).toContain("top: 208px");
    expect(shadow?.textContent).toContain("Service runtime overview");
    expect(shadow?.textContent).toContain("Step 2 / 5");
  });

  it("refreshes highlight on resize without resetting confirmation state", () => {
    renderCloudflareFixture();
    const createButton = document.querySelector("button");
    if (!createButton) {
      throw new Error("Expected fixture create button.");
    }
    setElementRect(createButton, { x: 24, y: 60, width: 160, height: 44 });

    const root = mountMichiInjectedShell(document, {
      href: "https://dash.cloudflare.com/example-account/workers-and-pages",
      title: "Workers & Pages"
    });
    const shadow = root.shadowRoot;

    click(shadow?.querySelector("[data-action='check']") ?? null);
    click(shadow?.querySelector("[data-action='next-step']") ?? null);
    expect(shadow?.textContent).toContain("Confirm Create service");

    setElementRect(createButton, { x: 48, y: 84, width: 160, height: 44 });
    window.dispatchEvent(new Event("resize"));

    expect(shadow?.querySelector("[data-highlight]")?.getAttribute("style")).toContain("left: 46px");
    expect(shadow?.querySelector("[data-highlight]")?.getAttribute("style")).toContain("top: 82px");
    expect(shadow?.querySelector("[data-target-callout]")?.getAttribute("style")).toContain("left: 48px");
    expect(shadow?.querySelector("[data-target-callout]")?.getAttribute("style")).toContain("top: 138px");
    expect(shadow?.textContent).toContain("Confirm Create service");
    expect(shadow?.textContent).not.toContain("Step 3 / 5");
  });

  it("describes how to recover when the expected route target is missing", () => {
    const guidance = recoveryGuidanceForContext(hostContext());

    expect(guidance?.title).toBe("Expected control missing");
    expect(guidance?.reason).toContain("Create service button");
    expect(guidance?.impact).toContain("Michi cannot safely anchor this step");
    expect(guidance?.recoveryAction).toContain("Recover now");
  });

  it("describes unsupported page contexts without rendering normal target copy", () => {
    const guidance = recoveryGuidanceForContext(
      hostContext({
        routeId: "cloudflare.unsupported",
        locationLabel: "Unsupported page context",
        signals: [
          {
            id: "unsupported-page",
            label: "Unsupported page",
            value: "Unsupported page: Michi only reads Cloudflare dashboard pages in this milestone.",
            severity: "info"
          }
        ]
      })
    );

    expect(guidance?.title).toBe("Unsupported page");
    expect(guidance?.recoveryAction).toContain("supported workspace page");
  });

  it("describes route mismatch between the active guide and checked page", () => {
    const guidance = recoveryGuidanceForContext(
      hostContext({
        routeId: "cloudflare.pages.overview",
        locationLabel: "Pages / Overview",
        targets: [
          {
            id: "create-pages-button",
            label: "Create Pages project button",
            role: "button",
            text: "Create Pages project",
            confidence: "high"
          }
        ]
      }),
      "backend-api"
    );

    expect(guidance?.title).toBe("Wrong guide area");
    expect(guidance?.reason).toContain("active guide is Service runtime");
    expect(guidance?.reason).toContain("checked page looks like Site publishing");
    expect(guidance?.impact).toContain("Michi keeps the current guide selected");
    expect(guidance?.recoveryAction).toContain("Return to the Service runtime path");
  });

  it("shows unsupported recovery after a stale critical confirmation phase", () => {
    renderCloudflareFixture();
    const location = {
      href: "https://dash.cloudflare.com/example-account/workers-and-pages",
      title: "Workers & Pages"
    };
    const root = mountMichiInjectedShell(document, location);
    const shadow = root.shadowRoot;

    click(shadow?.querySelector("[data-action='check']") ?? null);
    click(shadow?.querySelector("[data-action='next-step']") ?? null);
    expect(shadow?.textContent).toContain("Confirm Create service");

    renderUnsupportedAreaFixture();
    location.href = "https://dash.cloudflare.com/example-account/analytics";
    location.title = "Analytics";
    click(shadow?.querySelector("[data-action='check']") ?? null);

    expect(shadow?.textContent).toContain("Unsupported page");
    expect(shadow?.textContent).toContain("outside the current guide surface");
    expect(shadow?.textContent).toContain("Open a supported workspace page");
    expect(shadow?.textContent).not.toContain("Confirm Create service");
    expect(shadow?.textContent).not.toContain("Step 1 / 5");
  });

  it("shows unsupported recovery after a stale completion phase", () => {
    renderDeploymentResultFixture();
    const location = {
      href: "https://dash.cloudflare.com/example-account/workers/services/view/michi-starter/deployments",
      title: "Deployment complete"
    };
    const root = mountMichiInjectedShell(document, location);
    const shadow = root.shadowRoot;

    click(shadow?.querySelector("[data-action='check']") ?? null);
    click(shadow?.querySelector("[data-action='complete-guide']") ?? null);
    expect(shadow?.textContent).toContain("Primary path complete");

    renderUnsupportedAreaFixture();
    location.href = "https://dash.cloudflare.com/example-account/analytics";
    location.title = "Analytics";
    click(shadow?.querySelector("[data-action='check']") ?? null);

    expect(shadow?.textContent).toContain("Unsupported page");
    expect(shadow?.textContent).toContain("outside the current guide surface");
    expect(shadow?.textContent).toContain("Open a supported workspace page");
    expect(shadow?.textContent).not.toContain("First-run readiness");
    expect(shadow?.textContent).not.toContain("Primary path complete");
    expect(shadow?.textContent).not.toContain("Custom domain");
  });
});
