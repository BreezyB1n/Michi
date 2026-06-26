import type { BlockingState, Capability, GuideStep, PageState, ServiceKind } from "./types";

export const capabilities: Record<Capability["id"], Capability> = {
  "cloudflare-workers": {
    id: "cloudflare-workers",
    name: "Cloudflare Workers",
    concept: "Compute",
    explanation:
      "Workers runs lightweight service logic close to users and is a good first path for a small backend service or API."
  },
  "cloudflare-pages": {
    id: "cloudflare-pages",
    name: "Cloudflare Pages",
    concept: "Hosting",
    explanation:
      "Pages is Cloudflare's Hosting capability. It is better suited to static websites and frontend projects than backend service logic."
  },
  "cloudflare-dns": {
    id: "cloudflare-dns",
    name: "Cloudflare DNS",
    concept: "Domain routing",
    explanation:
      "DNS connects a human-owned domain to the deployed service, which is the next useful route after the Worker URL works."
  }
};

export const workersGuideSteps: GuideStep[] = [
  {
    id: "locate-workers",
    title: "Find the Workers entry",
    action: "Open the Workers & Pages area from the Cloudflare account sidebar.",
    purpose:
      "This places you inside Cloudflare's service runtime area, where logic can be created and deployed.",
    completionCheck: "The page shows Workers & Pages with a create action available.",
    targetId: "workers-pages-nav",
    expectedRouteId: "cloudflare.dashboard.home"
  },
  {
    id: "create-worker",
    title: "Create a Worker",
    action: "Choose Create Worker and keep the generated starter service.",
    purpose:
      "This creates the runtime container that will host the small public service.",
    completionCheck: "A Worker draft exists and the editor or setup view is visible.",
    targetId: "create-worker-button",
    expectedRouteId: "cloudflare.workers.overview",
    criticalAction: {
      label: "Create Worker",
      impact:
        "Creates a new Cloudflare Worker resource in the selected account. Michi simulates this action in the MVP."
    }
  },
  {
    id: "review-starter",
    title: "Review the starter response",
    action: "Read the starter handler and keep the default response for the demo.",
    purpose:
      "A tiny response is enough to prove the service can run before binding a domain or adding business logic.",
    completionCheck: "The Worker editor shows a valid request handler and no blocking validation errors.",
    targetId: "starter-handler",
    expectedRouteId: "cloudflare.workers.starter-editor"
  },
  {
    id: "deploy-worker",
    title: "Deploy the Worker",
    action: "Publish the Worker so Cloudflare can serve it from a Worker URL.",
    purpose:
      "Deployment turns the draft into a reachable service endpoint that other people can access.",
    completionCheck: "The deployment result includes a Worker URL.",
    targetId: "deploy-worker-button",
    expectedRouteId: "cloudflare.workers.deploy-review",
    criticalAction: {
      label: "Deploy Worker",
      impact:
        "Publishes the Worker to a reachable URL. Michi simulates this publish action in the MVP."
    }
  },
  {
    id: "verify-worker-url",
    title: "Verify the Worker URL",
    action: "Check the generated Worker URL and confirm it returns a working response.",
    purpose:
      "This proves the guide path reached the user's goal: a small service that other people can access.",
    completionCheck: "The Worker URL returns HTTP 200 with the starter response.",
    targetId: "worker-url",
    expectedRouteId: "cloudflare.workers.deploy-result"
  }
];

export const pagesGuideSteps: GuideStep[] = [
  {
    id: "locate-pages",
    title: "Find the Pages entry",
    action: "Open the Workers & Pages area from the Cloudflare account sidebar.",
    purpose:
      "Pages projects live beside Workers in Cloudflare, so this gets you into the right product area for hosting.",
    completionCheck: "The page shows Workers & Pages with Pages project actions available.",
    targetId: "workers-pages-nav",
    expectedRouteId: "cloudflare.dashboard.home"
  },
  {
    id: "create-pages-project",
    title: "Create a Pages project",
    action: "Choose Create Pages project and start a static assets project.",
    purpose:
      "This creates the hosting container that will serve the static website.",
    completionCheck: "A Pages setup flow is visible and asks how the site will be deployed.",
    targetId: "create-pages-button",
    expectedRouteId: "cloudflare.pages.overview"
  },
  {
    id: "choose-static-assets",
    title: "Choose static assets",
    action: "Select the static assets path and keep the generated project setup.",
    purpose:
      "A static assets path is the smallest local proof for a website that does not need backend logic.",
    completionCheck: "The Pages setup view shows static assets selected with no blocking validation errors.",
    targetId: "static-assets-option",
    expectedRouteId: "cloudflare.pages.static-assets"
  },
  {
    id: "deploy-pages-project",
    title: "Deploy the Pages project",
    action: "Deploy the Pages project so Cloudflare can serve it from a Pages URL.",
    purpose:
      "Deployment turns the static project into a reachable website that other people can access.",
    completionCheck: "The deployment result includes a Pages URL.",
    targetId: "deploy-pages-button",
    expectedRouteId: "cloudflare.pages.deploy-review",
    criticalAction: {
      label: "Deploy Pages project",
      impact:
        "Publishes the Pages project to a reachable URL. Michi simulates this publish action in the MVP."
    }
  },
  {
    id: "verify-pages-url",
    title: "Verify the Pages URL",
    action: "Open the generated Pages URL and confirm the static website loads.",
    purpose:
      "This proves the guide path reached the user's goal: a static website that other people can access.",
    completionCheck: "The Pages URL returns HTTP 200 with the starter website.",
    targetId: "pages-url",
    expectedRouteId: "cloudflare.pages.deploy-result"
  }
];

export const pageStatesByStep: PageState[] = [
  {
    location: "Cloudflare dashboard / Home",
    targetElement: "Workers & Pages sidebar item",
    evidence: "Account navigation is available and Workers & Pages can be opened.",
    completionSatisfied: true
  },
  {
    location: "Workers & Pages / Overview",
    targetElement: "Create Worker button",
    evidence: "Create Worker is visible but no Worker draft exists yet.",
    completionSatisfied: false
  },
  {
    location: "Workers / Starter editor",
    targetElement: "Starter request handler",
    evidence: "Worker draft exists with the default starter response.",
    completionSatisfied: true
  },
  {
    location: "Workers / Deployment review",
    targetElement: "Deploy button",
    evidence: "Deployment is ready but has not been published.",
    completionSatisfied: false
  },
  {
    location: "Workers / Deployment result",
    targetElement: "Worker URL",
    evidence: "Worker URL returned HTTP 200 with the starter response.",
    completionSatisfied: true
  }
];

export const pagesPageStatesByStep: PageState[] = [
  {
    location: "Cloudflare dashboard / Home",
    targetElement: "Workers & Pages sidebar item",
    evidence: "Account navigation is available and Pages can be opened.",
    completionSatisfied: true
  },
  {
    location: "Pages / Overview",
    targetElement: "Create Pages project button",
    evidence: "Create Pages project is visible but no Pages project exists yet.",
    completionSatisfied: false
  },
  {
    location: "Pages / Static assets setup",
    targetElement: "Static assets option",
    evidence: "Static assets flow is selected and the project setup is visible.",
    completionSatisfied: true
  },
  {
    location: "Pages / Deployment review",
    targetElement: "Deploy Pages button",
    evidence: "Pages deployment is ready but has not been published.",
    completionSatisfied: false
  },
  {
    location: "Pages / Deployment result",
    targetElement: "Pages URL",
    evidence: "Pages deployment generated a URL. Pages URL returned HTTP 200 with the starter website.",
    completionSatisfied: true
  }
];

export const guideStepsByServiceKind: Record<ServiceKind, GuideStep[]> = {
  "backend-api": workersGuideSteps,
  "static-site": pagesGuideSteps
};

export const pageStatesByServiceKind: Record<ServiceKind, PageState[]> = {
  "backend-api": pageStatesByStep,
  "static-site": pagesPageStatesByStep
};

export const blockingStates: Record<BlockingState["id"], BlockingState> = {
  "not-signed-in": {
    id: "not-signed-in",
    title: "Not signed in",
    reason:
      "Michi cannot confirm the Workers entry or account context until Cloudflare shows an authenticated dashboard.",
    recoveryAction: "Sign in to Cloudflare, then return to the dashboard and run the page check again."
  },
  "permission-missing": {
    id: "permission-missing",
    title: "Permission missing",
    reason:
      "The current account does not show permission to create or deploy a Worker, so the guide cannot continue with a write action.",
    recoveryAction:
      "Switch to an account with Workers access or ask an admin to grant permission before continuing."
  },
  "page-drift": {
    id: "page-drift",
    title: "Page layout changed",
    reason:
      "The expected entry is not visible in the simulated page state, which means the current step cannot be anchored.",
    recoveryAction: "Use the dashboard search for Workers & Pages, then let Michi re-check the page state."
  },
  "extension-runtime-unavailable": {
    id: "extension-runtime-unavailable",
    title: "Extension runtime unavailable",
    reason:
      "Michi could not read the active Cloudflare page from the extension runtime, so it cannot anchor the next guide step.",
    recoveryAction:
      "Open or refresh a supported Cloudflare dashboard tab, then run the page check again."
  }
};
