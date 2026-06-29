import type { HostPageContext, PageContextProvider } from "./types";

type MaybePromise<T> = T | Promise<T>;

export type PageContextAdapter = {
  id: string;
  product: string;
  readCurrentContext(): MaybePromise<HostPageContext>;
};

export const createPageContextProviderFromAdapter = (
  adapter: PageContextAdapter
): PageContextProvider => {
  const listeners = new Set<(context: HostPageContext) => void>();

  const publish = (context: HostPageContext) => {
    listeners.forEach((listener) => listener(context));
    return context;
  };

  return {
    getCurrentContext: async () => publish(await adapter.readCurrentContext()),
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }
  };
};
