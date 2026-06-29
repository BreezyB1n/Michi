import { describe, expect, it } from "vitest";
import {
  productRouteLabel,
  sanitizeProviderText
} from "../src/domain/productPresentation";

describe("product presentation copy", () => {
  it("maps known internal route ids into product labels", () => {
    expect(sanitizeProviderText("cloudflare.workers.overview detected with 1 target.")).toBe(
      "Service runtime overview detected with 1 target."
    );
  });

  it("hides unknown provider route ids from visible copy", () => {
    expect(productRouteLabel("cloudflare.unexpected-page")).toBe("unexpected page");
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
