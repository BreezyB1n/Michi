import type { BlockingState, Capability, GuideStep, PageState } from "./types";

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
