import type { HostPageContext, PageSignal, PageTarget } from "../domain/types";

const maxTargetTextLength = 120;

type PageReaderLocation = {
  href: string;
  title: string;
};

type RouteDefinition = {
  routeId: string;
  locationLabel: string;
  unsupportedReason?: "non-cloudflare" | "cloudflare-area";
};

const candidateSelector = [
  "a",
  "button",
  "[role='button']",
  "[role='navigation']",
  "[role='link']",
  "input",
  "textarea",
  "pre",
  "code",
  "[aria-label]",
  "[data-testid]"
].join(",");

export const textWithinLimit = (input: string, limit = maxTargetTextLength) => {
  const normalized = input.replace(/\s+/g, " ").trim();

  if (normalized.length <= limit) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(limit - 3, 0))}...`;
};

const elementText = (element: Element) => {
  const ariaLabel = element.getAttribute("aria-label");
  const value =
    element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement
      ? element.value
      : undefined;

  return textWithinLimit(ariaLabel ?? value ?? element.textContent ?? "");
};

const isElementVisible = (element: Element) => {
  if (
    element.closest("[hidden]") ||
    element.closest("[aria-hidden='true']") ||
    element.getAttribute("type") === "hidden"
  ) {
    return false;
  }

  const ownerWindow = element.ownerDocument.defaultView;
  const style = ownerWindow?.getComputedStyle(element);

  return style?.display !== "none" && style?.visibility !== "hidden";
};

const candidateElements = (doc: Document) =>
  Array.from(doc.querySelectorAll(candidateSelector)).filter(isElementVisible);

const visiblePageText = (doc: Document) =>
  textWithinLimit(
    Array.from(doc.querySelectorAll("h1,h2,h3,p,a,button,pre,code,textarea,[aria-label]"))
      .filter(isElementVisible)
      .map((element) => elementText(element))
      .join(" "),
    2_000
  );

const boundingBoxForElement = (element: Element) => {
  const rect = element.getBoundingClientRect();

  if (!rect.width && !rect.height) {
    return undefined;
  }

  return {
    x: Math.round(rect.x),
    y: Math.round(rect.y),
    width: Math.round(rect.width),
    height: Math.round(rect.height)
  };
};

const targetFromElement = (
  id: string,
  label: string,
  role: PageTarget["role"],
  element: Element,
  confidence: PageTarget["confidence"] = "high"
): PageTarget => ({
  id,
  label,
  role,
  text: elementText(element),
  confidence,
  boundingBox: boundingBoxForElement(element)
});

const findByText = (elements: Element[], pattern: RegExp) =>
  elements.find((element) => pattern.test(elementText(element)));

const findWorkerUrlElement = (elements: Element[]) =>
  elements.find((element) => {
    const href = element instanceof HTMLAnchorElement ? element.href : "";
    return /https:\/\/[^\s]+\.workers\.dev/i.test(`${elementText(element)} ${href}`);
  });

const findPagesUrlElement = (elements: Element[]) =>
  elements.find((element) => {
    const href = element instanceof HTMLAnchorElement ? element.href : "";
    return /https:\/\/[^\s]+\.pages\.dev/i.test(`${elementText(element)} ${href}`);
  });

const detectRoute = (url: URL, pageText: string): RouteDefinition => {
  if (url.hostname !== "dash.cloudflare.com") {
    return {
      routeId: "cloudflare.unsupported",
      locationLabel: "Unsupported page context",
      unsupportedReason: "non-cloudflare"
    };
  }

  if (/deploy pages project|deploy pages/i.test(pageText) || /\/pages\/deploy-review/i.test(url.pathname)) {
    return {
      routeId: "cloudflare.pages.deploy-review",
      locationLabel: "Pages / Deployment review"
    };
  }

  if (/\bdeploy\b/i.test(pageText) && /workers/i.test(pageText)) {
    return {
      routeId: "cloudflare.workers.deploy-review",
      locationLabel: "Workers / Deployment review"
    };
  }

  if (/static assets/i.test(pageText) || /\/pages\/new\/static-assets/i.test(url.pathname)) {
    return {
      routeId: "cloudflare.pages.static-assets",
      locationLabel: "Pages / Static assets setup"
    };
  }

  if (/\/pages$/i.test(url.pathname) || /create pages project|pages projects/i.test(pageText)) {
    return {
      routeId: "cloudflare.pages.overview",
      locationLabel: "Pages / Overview"
    };
  }

  if (
    /\/pages\/deploy-result/i.test(url.pathname) ||
    (/\/pages\b/i.test(url.pathname) && /deployment complete/i.test(pageText)) ||
    (/pages\.dev/i.test(pageText) && /deployment complete/i.test(pageText))
  ) {
    return {
      routeId: "cloudflare.pages.deploy-result",
      locationLabel: "Pages / Deployment result"
    };
  }

  if (/workers\.dev/i.test(pageText) || /deployment complete/i.test(pageText)) {
    return {
      routeId: "cloudflare.workers.deploy-result",
      locationLabel: "Workers / Deployment result"
    };
  }

  if (/export default|fetch\s*\(/i.test(pageText)) {
    return {
      routeId: "cloudflare.workers.starter-editor",
      locationLabel: "Workers / Starter editor"
    };
  }

  if (/\/pages/i.test(url.pathname)) {
    return {
      routeId: "cloudflare.pages.overview",
      locationLabel: "Pages / Overview"
    };
  }

  if (/workers-and-pages|\/workers/i.test(url.pathname) || /create worker/i.test(pageText)) {
    return {
      routeId: "cloudflare.workers.overview",
      locationLabel: "Workers & Pages / Overview"
    };
  }

  if (url.pathname.split("/").filter(Boolean).length <= 1) {
    return {
      routeId: "cloudflare.dashboard.home",
      locationLabel: "Cloudflare dashboard / Home"
    };
  }

  return {
    routeId: "cloudflare.unsupported",
    locationLabel: "Unsupported Cloudflare dashboard area",
    unsupportedReason: "cloudflare-area"
  };
};

const extractTargets = (doc: Document): PageTarget[] => {
  const elements = candidateElements(doc);
  const targets: PageTarget[] = [];
  const workersNav = findByText(elements, /workers\s*&\s*pages/i);
  const createWorker = findByText(elements, /create(?:\s+a)?\s+worker/i);
  const createPages = findByText(elements, /create pages project|create pages/i);
  const staticAssets = findByText(elements, /static assets/i);
  const starterHandler = findByText(elements, /export default|fetch\s*\(/i);
  const deployWorker = findByText(elements, /^(deploy|deploy worker)$/i);
  const deployPages = findByText(elements, /deploy pages project|deploy pages/i);
  const workerUrl = findWorkerUrlElement(elements);
  const pagesUrl = findPagesUrlElement(elements);

  if (workersNav) {
    targets.push(targetFromElement("workers-pages-nav", "Workers & Pages sidebar item", "navigation", workersNav));
  }

  if (createWorker) {
    targets.push(targetFromElement("create-worker-button", "Create Worker button", "button", createWorker));
  }

  if (createPages) {
    targets.push(targetFromElement("create-pages-button", "Create Pages project button", "button", createPages));
  }

  if (staticAssets) {
    targets.push(targetFromElement("static-assets-option", "Static assets option", "button", staticAssets));
  }

  if (starterHandler) {
    targets.push(targetFromElement("starter-handler", "Starter request handler", "content", starterHandler, "medium"));
  }

  if (deployWorker) {
    targets.push(targetFromElement("deploy-worker-button", "Deploy button", "button", deployWorker));
  }

  if (deployPages) {
    targets.push(targetFromElement("deploy-pages-button", "Deploy Pages button", "button", deployPages));
  }

  if (workerUrl) {
    targets.push(targetFromElement("worker-url", "Worker URL", "status", workerUrl));
  }

  if (pagesUrl) {
    targets.push(targetFromElement("pages-url", "Pages URL", "status", pagesUrl));
  }

  return targets;
};

const signalForRoute = (route: RouteDefinition, targets: PageTarget[]): PageSignal => {
  const { routeId } = route;
  const workerUrl = targets.find((target) => target.id === "worker-url");
  const pagesUrl = targets.find((target) => target.id === "pages-url");

  if (routeId === "cloudflare.pages.deploy-result" && pagesUrl) {
    return {
      id: "pages-url-detected",
      label: "Pages URL detected",
      value: `${pagesUrl.text} is visible on the page.`,
      severity: "success"
    };
  }

  if (routeId === "cloudflare.workers.deploy-result" && workerUrl) {
    return {
      id: "worker-url-detected",
      label: "Worker URL detected",
      value: `${workerUrl.text} is visible on the page.`,
      severity: "success"
    };
  }

  if (routeId === "cloudflare.unsupported") {
    if (route.unsupportedReason === "cloudflare-area") {
      return {
        id: "unsupported-cloudflare-area",
        label: "Unsupported Cloudflare area",
        value:
          "This Cloudflare dashboard area is outside Michi's Workers guide path. Open Workers & Pages and click Check page again.",
        severity: "info"
      };
    }

    return {
      id: "unsupported-page",
      label: "Unsupported page",
      value: "Unsupported page: Michi only reads Cloudflare dashboard pages in this milestone.",
      severity: "info"
    };
  }

  return {
    id: `${routeId}-detected`,
    label: "Cloudflare route detected",
    value: `${routeId} detected with ${targets.length} target${targets.length === 1 ? "" : "s"}.`,
    severity: targets.length > 0 ? "info" : "warning"
  };
};

export const readCloudflarePageContext = (
  doc: Document = document,
  location: PageReaderLocation = {
    href: window.location.href,
    title: document.title
  }
): HostPageContext => {
  const url = new URL(location.href);
  const pageText = visiblePageText(doc);
  const route = detectRoute(url, pageText);
  const targets = route.routeId === "cloudflare.unsupported" ? [] : extractTargets(doc);

  return {
    url: url.href,
    title: location.title,
    product: "cloudflare",
    locationLabel: route.locationLabel,
    routeId: route.routeId,
    detectedAt: new Date().toISOString(),
    targets,
    signals: [signalForRoute(route, targets)]
  };
};
