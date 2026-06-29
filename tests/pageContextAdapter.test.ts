import { describe, expect, it } from "vitest";
import {
  createPageContextProviderFromAdapter,
  type PageContextAdapter
} from "../src/domain/pageContextAdapter";
import type { HostPageContext } from "../src/domain/types";

const context = (overrides: Partial<HostPageContext> = {}): HostPageContext => ({
  url: "https://example.test/workspace",
  title: "Example workspace",
  product: "cloudflare",
  locationLabel: "Workspace / Home",
  routeId: "example.workspace.home",
  detectedAt: "2026-06-29T00:00:00.000Z",
  targets: [],
  signals: [
    {
      id: "workspace-visible",
      label: "Workspace visible",
      value: "Workspace visible",
      severity: "info"
    }
  ],
  ...overrides
});

describe("page context adapter contract", () => {
  it("wraps a provider-neutral adapter as the existing PageContextProvider interface", async () => {
    const adapter: PageContextAdapter = {
      id: "test-adapter",
      product: "supported-workspace",
      readCurrentContext: () => context()
    };

    const provider = createPageContextProviderFromAdapter(adapter);

    await expect(provider.getCurrentContext()).resolves.toMatchObject({
      routeId: "example.workspace.home",
      title: "Example workspace"
    });
  });

  it("publishes adapter context reads to provider subscribers", async () => {
    const contexts = [
      context({ routeId: "example.workspace.home" }),
      context({ routeId: "example.workspace.details" })
    ];
    const adapter: PageContextAdapter = {
      id: "test-adapter",
      product: "supported-workspace",
      readCurrentContext: () => contexts.shift() ?? context()
    };
    const provider = createPageContextProviderFromAdapter(adapter);
    const received: string[] = [];

    const unsubscribe = provider.subscribe((nextContext) => {
      received.push(nextContext.routeId);
    });

    await provider.getCurrentContext();
    await provider.getCurrentContext();
    unsubscribe();
    await provider.getCurrentContext();

    expect(received).toEqual(["example.workspace.home", "example.workspace.details"]);
  });

  it("lets an adapter represent unsupported context without throwing", async () => {
    const adapter: PageContextAdapter = {
      id: "test-adapter",
      product: "supported-workspace",
      readCurrentContext: () =>
        context({
          routeId: "michi.unsupported",
          locationLabel: "Unsupported page context",
          signals: [
            {
              id: "unsupported-page",
              label: "Unsupported page",
              value: "This page is outside the supported runtime boundary.",
              severity: "info"
            }
          ]
        })
    };

    const provider = createPageContextProviderFromAdapter(adapter);

    await expect(provider.getCurrentContext()).resolves.toMatchObject({
      routeId: "michi.unsupported",
      signals: [expect.objectContaining({ severity: "info" })]
    });
  });
});
