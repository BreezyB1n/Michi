import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "../src/App";
import { unsupportedPageContext } from "../src/domain/extensionPageContextProvider";
import type { MichiPageContextRuntime } from "../src/domain/pageContextRuntime";
import type { HostPageContext } from "../src/domain/types";

const sampleIntent = "I want to build a small service that other people can access.";
const providerVisibleCopyPattern =
  /\b(?:Cloudflare|Workers|Worker|DNS|Pages|MVP|demo|page context|context status)\b|cloudflare\.|workers\.dev|pages\.dev|dash\.cloudflare|current app|simulat/i;

const expectProductOnlyVisibleCopy = () => {
  const accessibleCopy = Array.from(
    document.body.querySelectorAll("[aria-label], [title], [alt], [placeholder]")
  )
    .flatMap((element) =>
      ["aria-label", "title", "alt", "placeholder"].map((attribute) =>
        element.getAttribute(attribute)
      )
    )
    .filter(Boolean)
    .join(" ");

  expect(`${document.body.textContent ?? ""} ${accessibleCopy}`).not.toMatch(
    providerVisibleCopyPattern
  );
};

const startBackendGuide = async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole("button", { name: /^guide$/i }));
  await user.clear(screen.getByLabelText(/user intent/i));
  await user.type(screen.getByLabelText(/user intent/i), sampleIntent);
  await user.click(screen.getByRole("button", { name: /start guide/i }));
  await user.click(screen.getByRole("button", { name: /backend logic or api/i }));

  return user;
};

const startStaticGuide = async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole("button", { name: /^guide$/i }));
  await user.clear(screen.getByLabelText(/user intent/i));
  await user.type(screen.getByLabelText(/user intent/i), "Publish a static website.");
  await user.click(screen.getByRole("button", { name: /start guide/i }));
  await user.click(screen.getByRole("button", { name: /static website/i }));

  return user;
};

const extensionFailureRuntime = (): MichiPageContextRuntime => {
  const failedContext = unsupportedPageContext("No receiving end", "error");

  return {
    mode: "extension",
    getInitialContext: () =>
      unsupportedPageContext("Run Check to read the current page from the extension."),
    getCurrentContext: async () => failedContext,
    syncGuideStep: async () => failedContext,
    simulatePageDrift: async () => failedContext,
    recoverToStep: async () => failedContext,
    subscribe: () => () => undefined
  };
};

const extensionRejectingRuntime = (): MichiPageContextRuntime => ({
  mode: "extension",
  getInitialContext: () =>
    unsupportedPageContext("Run Check to read the current page from the extension."),
  getCurrentContext: async () => {
    throw new Error("Extension request rejected");
  },
  syncGuideStep: async () => {
    throw new Error("Extension request rejected");
  },
  simulatePageDrift: async () => {
    throw new Error("Extension request rejected");
  },
  recoverToStep: async () => {
    throw new Error("Extension request rejected");
  },
  subscribe: () => () => undefined
});

const extensionThrowingRuntime = (): MichiPageContextRuntime => ({
  mode: "extension",
  getInitialContext: () =>
    unsupportedPageContext("Run Check to read the current page from the extension."),
  getCurrentContext: () => {
    throw new Error("Synchronous extension failure");
  },
  syncGuideStep: () => {
    throw new Error("Synchronous extension failure");
  },
  simulatePageDrift: () => {
    throw new Error("Synchronous extension failure");
  },
  recoverToStep: () => {
    throw new Error("Synchronous extension failure");
  },
  subscribe: () => () => undefined
});

const delayedExtensionRuntime = () => {
  let resolveStepContext: (context: HostPageContext) => void = () => undefined;
  const pendingStepContext = new Promise<HostPageContext>((resolve) => {
    resolveStepContext = resolve;
  });

  const runtime: MichiPageContextRuntime = {
    mode: "extension",
    getInitialContext: () =>
      unsupportedPageContext("Run Check to read the current page from the extension."),
    getCurrentContext: async () =>
      unsupportedPageContext("Manual check context is not used in this test."),
    syncGuideStep: async () => pendingStepContext,
    simulatePageDrift: async () =>
      unsupportedPageContext("Page drift context is not used in this test."),
    recoverToStep: async () =>
      unsupportedPageContext("Reset context is available after reset."),
    subscribe: () => () => undefined
  };

  return {
    runtime,
    resolveStepContext
  };
};

describe("Michi app", () => {
  it("renders intent entry and starts the clarification flow", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole("button", { name: /^guide$/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/michi side panel/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^guide$/i }));

    expect(screen.getByRole("heading", { name: /michi/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/user intent/i)).toHaveValue(sampleIntent);
    expect(screen.getByRole("button", { name: /^guide$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /check page/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /minimize panel/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /image mode/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /video mode/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /start guide/i }));

    expect(screen.getByText(/what kind of service are you building/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /backend logic or api/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /static website/i })).toBeInTheDocument();
  });

  it("collapses and expands the guide panel without resetting session state", async () => {
    const user = await startBackendGuide();

    expect(screen.getByRole("heading", { name: /Find the build area/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /minimize panel/i }));
    expect(screen.queryByLabelText(/michi side panel/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^guide$/i }));
    expect(screen.getByRole("heading", { name: /Find the build area/i })).toBeInTheDocument();
  });

  it("shows the Guide Workspace with capability, step purpose, completion check, and page state", async () => {
    await startBackendGuide();

    expect(screen.getByLabelText(/current page preview/i)).toBeInTheDocument();
    const sidePanel = screen.getByLabelText(/michi side panel/i);
    expect(sidePanel).toBeInTheDocument();
    expect(within(sidePanel).getAllByText(/Service runtime/i).length).toBeGreaterThan(0);
    expect(within(sidePanel).getByText(/Deployable endpoint/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Find the build area/i })).toBeInTheDocument();
    expect(screen.getByText(/Step purpose/i)).toBeInTheDocument();
    expect(screen.getByText(/Completion check/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Workspace \/ Home/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Build area navigation item/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Page check synced/i).length).toBeGreaterThan(0);
    expect(within(sidePanel).queryByText(/cloudflare|workers|pages|dns/i)).not.toBeInTheDocument();
  });

  it("records guide actions in a compact activity timeline", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /^guide$/i }));

    let activity = screen.getByLabelText(/activity history/i);
    expect(within(activity).getByText(/No activity yet/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /start guide/i }));

    activity = screen.getByLabelText(/activity history/i);
    expect(within(activity).getByText(/Intent captured/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /backend logic or api/i }));

    activity = screen.getByLabelText(/activity history/i);
    expect(await within(activity).findByText(/Service path selected/i)).toBeInTheDocument();
    expect(within(activity).getByText(/Page check synced/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /advance guide/i }));
    await user.click(screen.getByRole("button", { name: /advance guide/i }));

    activity = screen.getByLabelText(/activity history/i);
    expect(within(activity).getByText(/Confirmation needed/i)).toBeInTheDocument();
    expect(within(activity).queryByText(/Action confirmed/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /confirm action/i }));

    activity = screen.getByLabelText(/activity history/i);
    expect(await within(activity).findByText(/Action confirmed/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /show page drift/i }));

    activity = screen.getByLabelText(/activity history/i);
    expect(await within(activity).findByText(/Check needs recovery/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /recover and re-check/i }));

    activity = screen.getByLabelText(/activity history/i);
    expect(await within(activity).findByText(/Recovery completed/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /advance guide/i }));
    await user.click(screen.getByRole("button", { name: /advance guide/i }));
    await user.click(screen.getByRole("button", { name: /confirm action/i }));
    await user.click(screen.getByRole("button", { name: /advance guide/i }));

    activity = screen.getByLabelText(/activity history/i);
    expect(await within(activity).findByText(/Completion evidence passed/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /reset/i }));

    activity = screen.getByLabelText(/activity history/i);
    expect(within(activity).getByText(/Session reset/i)).toBeInTheDocument();
    expect(within(activity).queryByText(/Intent captured/i)).not.toBeInTheDocument();
  });

  it("renders a command handoff that invokes existing guide actions", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /^guide$/i }));

    let handoff = screen.getByLabelText(/command handoff/i);
    expect(within(handoff).getByText(/Ready for an intent/i)).toBeInTheDocument();

    await user.click(within(handoff).getByRole("button", { name: /start from intent/i }));

    handoff = screen.getByLabelText(/command handoff/i);
    expect(await within(handoff).findByText(/Choose a guide path/i)).toBeInTheDocument();

    await user.click(within(handoff).getByRole("button", { name: /site path/i }));

    handoff = screen.getByLabelText(/command handoff/i);
    expect((await screen.findAllByText(/Site publishing/i)).length).toBeGreaterThan(0);
    expect(await within(handoff).findByText(/Next step is ready/i)).toBeInTheDocument();

    await user.click(within(handoff).getByRole("button", { name: /continue/i }));

    expect(await screen.findByRole("heading", { name: /Create a site/i })).toBeInTheDocument();
  });

  it("keeps command handoff safe in confirmation and recovery states", async () => {
    const user = await startBackendGuide();

    let handoff = screen.getByLabelText(/command handoff/i);
    await user.click(within(handoff).getByRole("button", { name: /continue/i }));

    handoff = screen.getByLabelText(/command handoff/i);
    expect(within(handoff).getByText(/Confirmation will be required/i)).toBeInTheDocument();

    await user.click(within(handoff).getByRole("button", { name: /review confirmation/i }));

    handoff = screen.getByLabelText(/command handoff/i);
    expect(await within(handoff).findByText(/User confirmation needed/i)).toBeInTheDocument();
    expect(within(handoff).getByRole("button", { name: /confirm now/i })).toBeInTheDocument();
    expect(within(handoff).queryByRole("button", { name: /advance guide/i })).not.toBeInTheDocument();
    expect(within(handoff).queryByRole("button", { name: /complete guide/i })).not.toBeInTheDocument();

    await user.click(within(handoff).getByRole("button", { name: /confirm now/i }));
    await user.click(screen.getByRole("button", { name: /show page drift/i }));

    handoff = screen.getByLabelText(/command handoff/i);
    expect(await within(handoff).findByText(/Recovery is required/i)).toBeInTheDocument();
    expect(within(handoff).getByRole("button", { name: /recover now/i })).toBeInTheDocument();
    expect(within(handoff).queryByRole("button", { name: /advance guide/i })).not.toBeInTheDocument();
    expect(within(handoff).queryByRole("button", { name: /complete guide/i })).not.toBeInTheDocument();
  });

  it("allows long activity details to wrap inside the panel", async () => {
    const user = userEvent.setup();
    const longIntent = `Publish ${"a".repeat(160)} https://example.com/${"b".repeat(160)}`;

    render(<App />);

    await user.click(screen.getByRole("button", { name: /^guide$/i }));
    await user.clear(screen.getByLabelText(/user intent/i));
    await user.type(screen.getByLabelText(/user intent/i), longIntent);
    await user.click(screen.getByRole("button", { name: /start guide/i }));

    const detail = screen.getByText(new RegExp(`Michi started from: Publish ${"a".repeat(20)}`));

    expect(detail).toHaveClass("break-words");
    expect(detail).toHaveClass("[overflow-wrap:anywhere]");
  });

  it("keeps the visible Michi shell in product language through provider-backed backend flow", async () => {
    const user = await startBackendGuide();

    expectProductOnlyVisibleCopy();

    await user.click(screen.getByRole("button", { name: /advance guide/i }));
    await user.click(screen.getByRole("button", { name: /advance guide/i }));
    await user.click(screen.getByRole("button", { name: /confirm action/i }));
    await user.click(screen.getByRole("button", { name: /advance guide/i }));
    await user.click(screen.getByRole("button", { name: /advance guide/i }));
    await user.click(screen.getByRole("button", { name: /confirm action/i }));
    await user.click(screen.getByRole("button", { name: /advance guide/i }));

    expect(screen.getByRole("heading", { name: /Service URL verified/i })).toBeInTheDocument();
    expectProductOnlyVisibleCopy();
  });

  it("routes static website work through the Pages guide path", async () => {
    await startStaticGuide();

    expect(screen.getAllByText(/Site publishing/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Static web path/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: /Find the build area/i })).toBeInTheDocument();
    expect(screen.getByText(/Sites can be opened/i)).toBeInTheDocument();
    expect(screen.getByText(/Create and publish a site/i)).toBeInTheDocument();
    expect(screen.queryByText(/Acknowledge Sites and keep this guide on Services/i)).not.toBeInTheDocument();
  });

  it("requires explicit confirmation for a critical write action", async () => {
    const user = await startBackendGuide();

    await user.click(screen.getByRole("button", { name: /advance guide/i }));
    await user.click(screen.getByRole("button", { name: /advance guide/i }));

    expect(screen.getByRole("heading", { name: /Confirm Create service/i })).toBeInTheDocument();
    expect(screen.getByText(/Prepares a new service resource/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /confirm action/i }));

    expect(screen.getByRole("heading", { name: /Review the starter response/i })).toBeInTheDocument();
  });

  it("explains and recovers from page drift", async () => {
    const user = await startBackendGuide();

    await user.click(screen.getByRole("button", { name: /show page drift/i }));

    expect(screen.getByRole("heading", { name: /Page layout changed/i })).toBeInTheDocument();
    expect(screen.getByText(/Recovery step/i)).toBeInTheDocument();
    expect(screen.getByText(/current step cannot be anchored/i)).toBeInTheDocument();
    expect(screen.getAllByText(/page search for Build area/i).length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/michi side panel/i)).not.toHaveTextContent(/cloudflare/i);
    expectProductOnlyVisibleCopy();

    await user.click(screen.getByRole("button", { name: /recover and re-check/i }));

    expect(screen.getByRole("heading", { name: /Find the build area/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Page check synced/i).length).toBeGreaterThan(0);
  });

  it("shows a recoverable extension runtime error when the page check cannot run", async () => {
    const user = userEvent.setup();
    render(<App pageContextRuntime={extensionFailureRuntime()} />);

    await user.click(screen.getByRole("button", { name: /^guide$/i }));
    await user.click(screen.getByRole("button", { name: /start guide/i }));
    await user.click(screen.getByRole("button", { name: /backend logic or api/i }));

    expect(await screen.findByRole("heading", { name: /Extension runtime unavailable/i })).toBeInTheDocument();
    expect(screen.getByText(/No receiving end/i)).toBeInTheDocument();
    expect(screen.getAllByText(/open or refresh a supported browser tab/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Check status/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Extension runtime error/i).length).toBeGreaterThanOrEqual(1);
    expectProductOnlyVisibleCopy();
  });

  it("converts rejected provider checks into the extension runtime recovery state", async () => {
    const user = userEvent.setup();
    render(<App pageContextRuntime={extensionRejectingRuntime()} />);

    await user.click(screen.getByRole("button", { name: /^guide$/i }));
    await user.click(screen.getByRole("button", { name: /start guide/i }));
    await user.click(screen.getByRole("button", { name: /backend logic or api/i }));

    expect(await screen.findByRole("heading", { name: /Extension runtime unavailable/i })).toBeInTheDocument();
    expect(screen.getByText(/Extension request rejected/i)).toBeInTheDocument();
  });

  it("converts synchronous provider failures into the extension runtime recovery state", async () => {
    const user = userEvent.setup();
    render(<App pageContextRuntime={extensionThrowingRuntime()} />);

    await user.click(screen.getByRole("button", { name: /^guide$/i }));
    await user.click(screen.getByRole("button", { name: /start guide/i }));
    await user.click(screen.getByRole("button", { name: /backend logic or api/i }));

    expect(await screen.findByRole("heading", { name: /Extension runtime unavailable/i })).toBeInTheDocument();
    expect(screen.getByText(/Synchronous extension failure/i)).toBeInTheDocument();
  });

  it("ignores stale provider results after reset", async () => {
    const user = userEvent.setup();
    const { runtime, resolveStepContext } = delayedExtensionRuntime();
    render(<App pageContextRuntime={runtime} />);

    await user.click(screen.getByRole("button", { name: /^guide$/i }));
    await user.click(screen.getByRole("button", { name: /start guide/i }));
    await user.click(screen.getByRole("button", { name: /backend logic or api/i }));
    await user.click(screen.getByRole("button", { name: /reset/i }));

    await act(async () => {
      resolveStepContext(unsupportedPageContext("No receiving end", "error"));
      await Promise.resolve();
    });

    expect(screen.queryByRole("heading", { name: /Extension runtime unavailable/i })).not.toBeInTheDocument();
    expect(screen.getByLabelText(/user intent/i)).toHaveValue(sampleIntent);
  });

  it("reaches completion with custom domain as the follow-up route", async () => {
    const user = await startBackendGuide();

    await user.click(screen.getByRole("button", { name: /advance guide/i }));
    await user.click(screen.getByRole("button", { name: /advance guide/i }));
    await user.click(screen.getByRole("button", { name: /confirm action/i }));
    await user.click(screen.getByRole("button", { name: /advance guide/i }));
    await user.click(screen.getByRole("button", { name: /advance guide/i }));
    await user.click(screen.getByRole("button", { name: /confirm action/i }));
    await user.click(screen.getByRole("button", { name: /advance guide/i }));

    expect(screen.getByRole("heading", { name: /Service URL verified/i })).toBeInTheDocument();
    expect(screen.getAllByText(/service URL returned HTTP 200/i).length).toBeGreaterThan(0);
    const sidePanel = screen.getByLabelText(/michi side panel/i);
    expect(within(sidePanel).getByText(/^Custom domain$/i)).toBeInTheDocument();
    expect(within(sidePanel).getByText(/^Routing follow-up$/i)).toBeInTheDocument();
  });

  it("reaches static-site completion with custom domain as the follow-up route", async () => {
    const user = await startStaticGuide();

    await user.click(screen.getByRole("button", { name: /advance guide/i }));
    await user.click(screen.getByRole("button", { name: /advance guide/i }));
    await user.click(screen.getByRole("button", { name: /advance guide/i }));
    await user.click(screen.getByRole("button", { name: /advance guide/i }));

    expect(screen.getByRole("heading", { name: /Confirm Deploy site/i })).toBeInTheDocument();
    expect(screen.getByText(/Publishes the site project/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /confirm action/i }));
    await user.click(screen.getByRole("button", { name: /advance guide/i }));

    expect(screen.getByRole("heading", { name: /Site URL verified/i })).toBeInTheDocument();
    expect(screen.getAllByText(/site URL returned HTTP 200/i).length).toBeGreaterThan(0);
    const sidePanel = screen.getByLabelText(/michi side panel/i);
    expect(within(sidePanel).getByText(/^Custom domain$/i)).toBeInTheDocument();
    expect(within(sidePanel).getByText(/^Routing follow-up$/i)).toBeInTheDocument();
  });
});
