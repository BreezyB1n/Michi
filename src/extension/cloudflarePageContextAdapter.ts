import type { PageContextAdapter } from "../domain/pageContextAdapter";
import { readCloudflarePageContext } from "./cloudflarePageReader";

type PageReaderLocation = {
  href: string;
  title: string;
};

export const createCloudflarePageContextAdapter = (
  doc: Document = document,
  location?: PageReaderLocation
): PageContextAdapter => ({
  id: "cloudflare-dashboard",
  product: "supported-workspace",
  readCurrentContext: () =>
    location ? readCloudflarePageContext(doc, location) : readCloudflarePageContext(doc)
});
