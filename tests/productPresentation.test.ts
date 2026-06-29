import { describe, expect, it } from "vitest";
import {
  productRouteLabel,
  sanitizeProviderText
} from "../src/domain/productPresentation";

describe("product presentation copy", () => {
  const providerVisibleCopyPattern =
    /\b(?:Cloudflare|Workers|Worker|DNS|Pages|MVP|demo)\b|cloudflare\.|workers\.dev|pages\.dev|dash\.cloudflare|current app|simulat/i;

  it("maps known internal route ids into product labels", () => {
    expect(sanitizeProviderText("cloudflare.workers.overview detected with 1 target.")).toBe(
      "Service runtime overview detected with 1 target."
    );
  });

  it("rewrites provider-owned route evidence into Michi product language", () => {
    const copy = sanitizeProviderText("Cloudflare route detected");

    expect(copy).toBe("Product route detected");
    expect(copy).not.toMatch(providerVisibleCopyPattern);
  });

  it("rewrites fixture/runtime staging words out of visible copy", () => {
    const copy = sanitizeProviderText(
      "The expected entry is not visible in the simulated page state. Michi simulates this action in the MVP."
    );

    expect(copy).toBe(
      "The expected entry is not visible in the page state. Michi previews this action in the current guide."
    );
    expect(copy).not.toMatch(providerVisibleCopyPattern);
  });

  it("hides unknown provider route ids from visible copy", () => {
    expect(productRouteLabel("cloudflare.unexpected-page")).toBe("unexpected page");
  });

  it("maps Michi runtime unsupported context into product language", () => {
    expect(productRouteLabel("michi.unsupported")).toBe("Unsupported runtime context");
  });

  it("hides provider-owned generated URL domains", () => {
    expect(
      sanitizeProviderText("https://michi-starter.example.workers.dev is visible on the page.")
    ).toBe("generated service URL is visible on the page.");
    expect(sanitizeProviderText("https://michi-static.pages.dev is visible on the page.")).toBe(
      "generated site URL is visible on the page."
    );
  });
});
