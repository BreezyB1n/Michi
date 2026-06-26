import { pageDriftContextForStep, createCloudflareMockPageContextProvider } from "./pageContextProvider";
import { createExtensionPageContextProvider, unsupportedPageContext } from "./extensionPageContextProvider";
import type { HostPageContext, PageContextProvider, ServiceKind } from "./types";

type MaybePromise<T> = T | Promise<T>;

export type PageContextRuntimeMode = "mock" | "extension";

export type MichiPageContextRuntime = PageContextProvider & {
  mode: PageContextRuntimeMode;
  getInitialContext(): HostPageContext;
  syncGuideStep(index: number, kind?: ServiceKind): MaybePromise<HostPageContext>;
  simulatePageDrift(index?: number, kind?: ServiceKind): MaybePromise<HostPageContext>;
  recoverToStep(index: number, kind?: ServiceKind): MaybePromise<HostPageContext>;
};

const readConfiguredMode = (): PageContextRuntimeMode => {
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
  return env?.VITE_MICHI_CONTEXT_PROVIDER === "extension" ? "extension" : "mock";
};

export const createMockPageContextRuntime = (): MichiPageContextRuntime => {
  const provider = createCloudflareMockPageContextProvider();

  return {
    ...provider,
    mode: "mock",
    getInitialContext: provider.getCurrentContextSync,
    syncGuideStep: provider.setStepIndex,
    simulatePageDrift: provider.simulatePageDrift,
    recoverToStep: provider.recoverToStep
  };
};

export const createExtensionPageContextRuntime = (): MichiPageContextRuntime => {
  const provider = createExtensionPageContextProvider();
  const readCurrentContext = () => provider.getCurrentContext();

  return {
    ...provider,
    mode: "extension",
    getInitialContext: () =>
      unsupportedPageContext("Run Check to read the current Cloudflare page from the extension."),
    syncGuideStep: readCurrentContext,
    simulatePageDrift: (index = 0, kind = "backend-api") => pageDriftContextForStep(index, kind),
    recoverToStep: readCurrentContext
  };
};

export const createMichiPageContextRuntime = (
  mode = readConfiguredMode()
): MichiPageContextRuntime =>
  mode === "extension" ? createExtensionPageContextRuntime() : createMockPageContextRuntime();
