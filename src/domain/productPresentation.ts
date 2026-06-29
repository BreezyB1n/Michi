import type {
  BlockingState,
  Capability,
  GuideStep,
  PageState,
  PageTarget,
  ServiceKind
} from "./types";

type ProductCapability = Pick<Capability, "name" | "concept" | "explanation">;

const capabilityCopyById: Record<Capability["id"], ProductCapability> = {
  "cloudflare-workers": {
    name: "Service runtime",
    concept: "Deployable endpoint",
    explanation:
      "Michi routes backend work toward the smallest path that can become a reachable service."
  },
  "cloudflare-pages": {
    name: "Site publishing",
    concept: "Static web path",
    explanation:
      "Michi routes static work toward a publishing path that can produce a reachable website."
  },
  "cloudflare-dns": {
    name: "Custom domain",
    concept: "Routing follow-up",
    explanation:
      "After the primary URL works, Michi recommends the domain route that makes the result easier to share."
  }
};

const serviceCapabilityCopy: Record<ServiceKind, ProductCapability> = {
  "backend-api": capabilityCopyById["cloudflare-workers"],
  "static-site": capabilityCopyById["cloudflare-pages"]
};

const targetLabelsById: Record<string, string> = {
  "workers-pages-nav": "Build area navigation item",
  "create-worker-button": "Create service button",
  "starter-handler": "Starter response handler",
  "deploy-worker-button": "Deploy service button",
  "worker-url": "Service URL",
  "create-pages-button": "Create site button",
  "static-assets-option": "Static assets option",
  "deploy-pages-button": "Deploy site button",
  "pages-url": "Site URL"
};

const targetLabelsByText: Record<string, string> = {
  "Workers & Pages sidebar item": "Build area navigation item",
  "Create Worker button": "Create service button",
  "Deploy button": "Deploy service button",
  "Worker URL": "Service URL",
  "Create Pages project button": "Create site button",
  "Deploy Pages button": "Deploy site button",
  "Pages URL": "Site URL"
};

const routeLabelsById: Record<string, string> = {
  "cloudflare.dashboard.home": "Workspace home",
  "cloudflare.workers.overview": "Service runtime overview",
  "cloudflare.workers.starter-editor": "Service editor",
  "cloudflare.workers.deploy-review": "Deployment review",
  "cloudflare.workers.deploy-result": "Deployment result",
  "cloudflare.pages.overview": "Site publishing overview",
  "cloudflare.pages.static-assets": "Static asset setup",
  "cloudflare.pages.deploy-review": "Site deployment review",
  "cloudflare.pages.deploy-result": "Site deployment result",
  "cloudflare.unsupported": "Unsupported page",
  "michi.unsupported": "Unsupported runtime context"
};

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const stepCopyById: Record<
  string,
  Pick<GuideStep, "title" | "action" | "purpose" | "completionCheck"> & {
    criticalAction?: GuideStep["criticalAction"];
  }
> = {
  "locate-workers": {
    title: "Find the build area",
    action: "Open the build area from the current page navigation.",
    purpose:
      "This places the user inside the part of the product where a reachable result can be created.",
    completionCheck: "The page shows creation actions are available."
  },
  "create-worker": {
    title: "Create a service",
    action: "Choose the create action and keep the generated starter service.",
    purpose: "This creates the runtime container that will host the small public service.",
    completionCheck: "A service draft exists and the editor or setup view is visible.",
    criticalAction: {
      label: "Create service",
      impact:
        "Creates a new service resource in the selected workspace. Michi simulates this action in the MVP."
    }
  },
  "review-starter": {
    title: "Review the starter response",
    action: "Read the starter handler and keep the default response for the demo.",
    purpose:
      "A tiny response is enough to prove the service can run before binding a domain or adding business logic.",
    completionCheck: "The service editor shows a valid request handler and no blocking validation errors."
  },
  "deploy-worker": {
    title: "Deploy the service",
    action: "Publish the service so it gets a reachable URL.",
    purpose:
      "Deployment turns the draft into a reachable endpoint that other people can access.",
    completionCheck: "The deployment result includes a service URL.",
    criticalAction: {
      label: "Deploy service",
      impact:
        "Publishes the service to a reachable URL. Michi simulates this publish action in the MVP."
    }
  },
  "verify-worker-url": {
    title: "Verify the service URL",
    action: "Check the generated service URL and confirm it returns a working response.",
    purpose:
      "This proves the guide path reached the user's goal: a small service that other people can access.",
    completionCheck: "The service URL returns HTTP 200 with the starter response."
  },
  "locate-pages": {
    title: "Find the build area",
    action: "Open the build area from the current page navigation.",
    purpose:
      "This places the user inside the part of the product where a static website can be published.",
    completionCheck: "The page shows site creation actions are available."
  },
  "create-pages-project": {
    title: "Create a site",
    action: "Choose the create action and start a static assets project.",
    purpose: "This creates the publishing container that will serve the static website.",
    completionCheck: "A site setup flow is visible and asks how the site will be deployed."
  },
  "choose-static-assets": {
    title: "Choose static assets",
    action: "Select the static assets path and keep the generated project setup.",
    purpose:
      "A static assets path is the smallest local proof for a website that does not need backend logic.",
    completionCheck: "The setup view shows static assets selected with no blocking validation errors."
  },
  "deploy-pages-project": {
    title: "Deploy the site",
    action: "Deploy the site so it gets a reachable URL.",
    purpose:
      "Deployment turns the static project into a reachable website that other people can access.",
    completionCheck: "The deployment result includes a site URL.",
    criticalAction: {
      label: "Deploy site",
      impact:
        "Publishes the site project to a reachable URL. Michi simulates this publish action in the MVP."
    }
  },
  "verify-pages-url": {
    title: "Verify the site URL",
    action: "Open the generated site URL and confirm the static website loads.",
    purpose:
      "This proves the guide path reached the user's goal: a static website that other people can access.",
    completionCheck: "The site URL returns HTTP 200 with the starter website."
  }
};

export const sanitizeProviderText = (value: string | undefined): string => {
  if (!value) {
    return "";
  }

  const withoutKnownRoutes = Object.entries(routeLabelsById).reduce(
    (copy, [routeId, label]) => copy.replace(new RegExp(escapeRegExp(routeId), "gi"), label),
    value
  );

  return withoutKnownRoutes
    .replace(/https?:\/\/[^\s"'<>)]*workers\.dev[^\s"'<>)]*/gi, "generated service URL")
    .replace(/https?:\/\/[^\s"'<>)]*pages\.dev[^\s"'<>)]*/gi, "generated site URL")
    .replace(/\bworkers\.dev\b/gi, "service URL")
    .replace(/\bpages\.dev\b/gi, "site URL")
    .replace(/\bcloudflare\.[a-z0-9._-]+/gi, "unexpected page")
    .replace(/Workers & Pages/g, "Build area")
    .replace(/supported Cloudflare dashboard tab/g, "supported browser tab")
    .replace(/Cloudflare dashboard tab/g, "supported browser tab")
    .replace(/Cloudflare dashboard/g, "current workspace")
    .replace(/Cloudflare account/g, "current workspace")
    .replace(/Cloudflare's/g, "the current app's")
    .replace(/Cloudflare/g, "current app")
    .replace(/dashboard search/g, "page search")
    .replace(/dashboard/g, "workspace")
    .replace(/Pages project/g, "site project")
    .replace(/Pages setup/g, "site setup")
    .replace(/Pages deployment/g, "site deployment")
    .replace(/Pages URL/g, "site URL")
    .replace(/Create Pages/g, "Create site")
    .replace(/Deploy Pages/g, "Deploy site")
    .replace(/Pages/g, "Sites")
    .replace(/Worker URL/g, "service URL")
    .replace(/Worker draft/g, "service draft")
    .replace(/Worker editor/g, "service editor")
    .replace(/Worker resource/g, "service resource")
    .replace(/Create Worker/g, "Create service")
    .replace(/Deploy Worker/g, "Deploy service")
    .replace(/Workers/g, "Services")
    .replace(/Worker/g, "service")
    .replace(/DNS/g, "custom domain")
    .replace(/Domain routing/g, "Routing follow-up");
};

export const productCapabilityCopy = (
  capability: Capability | undefined,
  serviceKind?: ServiceKind
): ProductCapability => {
  if (capability) {
    return capabilityCopyById[capability.id];
  }

  if (serviceKind) {
    return serviceCapabilityCopy[serviceKind];
  }

  return {
    name: "Capability pending",
    concept: "Unmapped",
    explanation: "Michi needs one routing choice before it can prepare a guide path."
  };
};

export const productGuideStepCopy = (step: GuideStep | undefined): GuideStep | undefined => {
  if (!step) {
    return undefined;
  }

  const mappedStep = stepCopyById[step.id];

  return {
    ...step,
    title: mappedStep?.title ?? sanitizeProviderText(step.title),
    action: mappedStep?.action ?? sanitizeProviderText(step.action),
    purpose: mappedStep?.purpose ?? sanitizeProviderText(step.purpose),
    completionCheck: mappedStep?.completionCheck ?? sanitizeProviderText(step.completionCheck),
    criticalAction: mappedStep?.criticalAction
      ? mappedStep.criticalAction
      : step.criticalAction
      ? {
          label: sanitizeProviderText(step.criticalAction.label),
          impact: sanitizeProviderText(step.criticalAction.impact)
        }
      : undefined
  };
};

export const productBlockingStateCopy = (blockingState: BlockingState): BlockingState => ({
  ...blockingState,
  title: sanitizeProviderText(blockingState.title),
  reason: sanitizeProviderText(blockingState.reason),
  recoveryAction: sanitizeProviderText(blockingState.recoveryAction)
});

export const productPageStateCopy = (pageState: PageState): PageState => ({
  ...pageState,
  location: productLocationLabel(pageState.location),
  targetElement: productTargetLabel(pageState.targetElement),
  evidence: sanitizeProviderText(pageState.evidence).replace(
    /^Provider synced:/,
    "Page context synced:"
  ),
  blockingState: pageState.blockingState
    ? productBlockingStateCopy(pageState.blockingState)
    : undefined
});

export const productTargetLabel = (target: PageTarget | string | undefined): string => {
  if (!target) {
    return "No target detected";
  }

  if (typeof target === "string") {
    return targetLabelsById[target] ?? targetLabelsByText[target] ?? sanitizeProviderText(target);
  }

  return targetLabelsById[target.id] ?? targetLabelsByText[target.label] ?? sanitizeProviderText(target.label);
};

export const productRouteLabel = (routeId: string | undefined): string =>
  routeId ? routeLabelsById[routeId] ?? sanitizeProviderText(routeId) : "No route detected";

export const productLocationLabel = (location: string | undefined): string => {
  if (!location) {
    return "No page location";
  }

  const locationMap: Record<string, string> = {
    "Cloudflare dashboard / Home": "Workspace / Home",
    "Workers & Pages / Overview": "Build area / Overview",
    "Workers / Starter editor": "Service / Starter editor",
    "Workers / Deployment review": "Service / Deployment review",
    "Workers / Deployment result": "Service / Deployment result",
    "Pages / Overview": "Site / Overview",
    "Pages / Static assets setup": "Site / Static assets setup",
    "Pages / Deployment review": "Site / Deployment review",
    "Pages / Deployment result": "Site / Deployment result"
  };

  return locationMap[location] ?? sanitizeProviderText(location);
};

export const productSignalCopy = (signal: { label: string; value: string }) => ({
  label: sanitizeProviderText(signal.label),
  value: sanitizeProviderText(signal.value)
});

export const productCompletionTitle = (serviceKind: ServiceKind | undefined): string =>
  serviceKind === "static-site" ? "Site URL verified" : "Service URL verified";
