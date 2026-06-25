import type { HostPageContext, PageSignal, PageTarget } from "../domain/types";

const maxTargetTextLength = 120;

type PageReaderLocation = {
  href: string;
  title: string;
};

type RouteDefinition = {
  routeId: string;
  locationLabel: string;
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

const detectRoute = (url: URL, pageText: string): RouteDefinition => {
  if (url.hostname !== "dash.cloudflare.com") {
    return {
      routeId: "cloudflare.unsupported",
      locationLabel: "Unsupported page context"
    };
  }

  if (/workers\.dev/i.test(pageText) || /deployment complete/i.test(pageText)) {
    return {
      routeId: "cloudflare.workers.deploy-result",
      locationLabel: "Workers / Deployment result"
    };
  }

  if (/\bdeploy\b/i.test(pageText) && /workers/i.test(pageText)) {
    return {
      routeId: "cloudflare.workers.deploy-review",
      locationLabel: "Workers / Deployment review"
    };
  }

  if (/export default|fetch\s*\(/i.test(pageText)) {
    return {
      routeId: "cloudflare.workers.starter-editor",
      locationLabel: "Workers / Starter editor"
    };
  }

  if (/workers-and-pages|\/workers/i.test(url.pathname) || /create worker/i.test(pageText)) {
    return {
      routeId: "cloudflare.workers.overview",
      locationLabel: "Workers & Pages / Overview"
    };
  }

  return {
    routeId: "cloudflare.dashboard.home",
    locationLabel: "Cloudflare dashboard / Home"
  };
};

const extractTargets = (doc: Document): PageTarget[] => {
  const elements = candidateElements(doc);
  const targets: PageTarget[] = [];
  const workersNav = findByText(elements, /workers\s*&\s*pages/i);
  const createWorker = findByText(elements, /create(?:\s+a)?\s+worker/i);
  const starterHandler = findByText(elements, /export default|fetch\s*\(/i);
  const deployWorker = findByText(elements, /^deploy\b|deploy worker/i);
  const workerUrl = findWorkerUrlElement(elements);

  if (workersNav) {
    targets.push(targetFromElement("workers-pages-nav", "Workers & Pages sidebar item", "navigation", workersNav));
  }

  if (createWorker) {
    targets.push(targetFromElement("create-worker-button", "Create Worker button", "button", createWorker));
  }

  if (starterHandler) {
    targets.push(targetFromElement("starter-handler", "Starter request handler", "content", starterHandler, "medium"));
  }

  if (deployWorker) {
    targets.push(targetFromElement("deploy-worker-button", "Deploy button", "button", deployWorker));
  }

  if (workerUrl) {
    targets.push(targetFromElement("worker-url", "Worker URL", "status", workerUrl));
  }

  return targets;
};

const signalForRoute = (routeId: string, targets: PageTarget[]): PageSignal => {
  const workerUrl = targets.find((target) => target.id === "worker-url");

  if (workerUrl) {
    return {
      id: "worker-url-detected",
      label: "Worker URL detected",
      value: `${workerUrl.text} is visible on the page.`,
      severity: "success"
    };
  }

  if (routeId === "cloudflare.unsupported") {
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
    signals: [signalForRoute(route.routeId, targets)]
  };
};
