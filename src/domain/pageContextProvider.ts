import {
  blockingStates,
  guideStepsByServiceKind,
  pageStatesByServiceKind
} from "./siteSkillPack";
import type {
  HostPageContext,
  PageContextProvider,
  PageSignal,
  PageTarget,
  ServiceKind
} from "./types";

export type CloudflareMockPageContextProvider = PageContextProvider & {
  getCurrentContextSync(): HostPageContext;
  setStepIndex(index: number, kind?: ServiceKind): HostPageContext;
  simulatePageDrift(index?: number, kind?: ServiceKind): HostPageContext;
  recoverToStep(index: number, kind?: ServiceKind): HostPageContext;
};

const routeIdsByServiceKind: Record<ServiceKind, string[]> = {
  "backend-api": [
    "cloudflare.dashboard.home",
    "cloudflare.workers.overview",
    "cloudflare.workers.starter-editor",
    "cloudflare.workers.deploy-review",
    "cloudflare.workers.deploy-result"
  ],
  "static-site": [
    "cloudflare.dashboard.home",
    "cloudflare.pages.overview",
    "cloudflare.pages.static-assets",
    "cloudflare.pages.deploy-review",
    "cloudflare.pages.deploy-result"
  ]
};

const pageTargets: PageTarget[] = [
  {
    id: "workers-pages-nav",
    label: "Workers & Pages sidebar item",
    role: "navigation",
    text: "Workers & Pages",
    confidence: "high",
    boundingBox: { x: 22, y: 198, width: 184, height: 40 }
  },
  {
    id: "create-worker-button",
    label: "Create Worker button",
    role: "button",
    text: "Create",
    confidence: "high",
    boundingBox: { x: 864, y: 136, width: 80, height: 40 }
  },
  {
    id: "starter-handler",
    label: "Starter request handler",
    role: "content",
    text: "export default { fetch(request) { return new Response('Hello World'); } }",
    confidence: "medium",
    boundingBox: { x: 270, y: 330, width: 358, height: 124 }
  },
  {
    id: "deploy-worker-button",
    label: "Deploy button",
    role: "button",
    text: "Deploy",
    confidence: "high",
    boundingBox: { x: 760, y: 580, width: 120, height: 42 }
  },
  {
    id: "worker-url",
    label: "Worker URL",
    role: "status",
    text: "https://michi-guide-demo.workers.dev",
    confidence: "high",
    boundingBox: { x: 270, y: 428, width: 344, height: 36 }
  },
  {
    id: "create-pages-button",
    label: "Create Pages project button",
    role: "button",
    text: "Create Pages project",
    confidence: "high",
    boundingBox: { x: 824, y: 136, width: 142, height: 40 }
  },
  {
    id: "static-assets-option",
    label: "Static assets option",
    role: "button",
    text: "Static assets",
    confidence: "high",
    boundingBox: { x: 270, y: 314, width: 220, height: 72 }
  },
  {
    id: "deploy-pages-button",
    label: "Deploy Pages button",
    role: "button",
    text: "Deploy Pages project",
    confidence: "high",
    boundingBox: { x: 748, y: 580, width: 158, height: 42 }
  },
  {
    id: "pages-url",
    label: "Pages URL",
    role: "status",
    text: "https://michi-static.pages.dev",
    confidence: "high",
    boundingBox: { x: 270, y: 428, width: 304, height: 36 }
  }
];

const guideStepsForKind = (kind: ServiceKind) => guideStepsByServiceKind[kind];
const pageStatesForKind = (kind: ServiceKind) => pageStatesByServiceKind[kind];

const clampedStepIndex = (index: number, kind: ServiceKind = "backend-api") =>
  Math.min(Math.max(index, 0), guideStepsForKind(kind).length - 1);

const detectedAtForStep = (index: number, kind: ServiceKind = "backend-api") =>
  new Date(Date.UTC(2026, 5, 24, 0, 0, clampedStepIndex(index, kind))).toISOString();

const signalForStep = (index: number, kind: ServiceKind = "backend-api"): PageSignal => {
  const stepIndex = clampedStepIndex(index, kind);
  const pageState = pageStatesForKind(kind)[stepIndex];
  const step = guideStepsForKind(kind)[stepIndex];
  return {
    id: `completion-${step.id}`,
    label: "Completion evidence",
    value: pageState.evidence,
    severity: pageState.completionSatisfied ? "success" : "info"
  };
};

export const hostPageContextForStep = (
  index: number,
  kind: ServiceKind = "backend-api"
): HostPageContext => {
  const stepIndex = clampedStepIndex(index, kind);
  const pageState = pageStatesForKind(kind)[stepIndex];
  const step = guideStepsForKind(kind)[stepIndex];
  const target = pageTargets.find((candidate) => candidate.id === step.targetId);

  return {
    url: `https://dash.cloudflare.com/mock/${routeIdsByServiceKind[kind][stepIndex]}`,
    title: pageState.location,
    product: "cloudflare",
    locationLabel: pageState.location,
    routeId: routeIdsByServiceKind[kind][stepIndex],
    detectedAt: detectedAtForStep(stepIndex, kind),
    targets: target ? [target] : [],
    signals: [signalForStep(stepIndex, kind)]
  };
};

export const pageDriftContextForStep = (
  index: number,
  kind: ServiceKind = "backend-api"
): HostPageContext => {
  const stepIndex = clampedStepIndex(index, kind);
  const step = guideStepsForKind(kind)[stepIndex];

  return {
    url: "https://dash.cloudflare.com/mock/unexpected-page",
    title: "Cloudflare dashboard / Unexpected page",
    product: "cloudflare",
    locationLabel: "Cloudflare dashboard / Unexpected page",
    routeId: "cloudflare.unexpected-page",
    detectedAt: detectedAtForStep(stepIndex, kind),
    targets: [],
    signals: [
      {
        id: `page-drift-${step.id}`,
        label: "Page drift",
        value: `Page drift detected: Michi expected ${step.title}, but the target is not present.`,
        severity: "warning"
      }
    ],
    blockingState: blockingStates["page-drift"]
  };
};

export const createCloudflareMockPageContextProvider = (
  initialStepIndex = 0
): CloudflareMockPageContextProvider => {
  let currentServiceKind: ServiceKind = "backend-api";
  let currentStepIndex = clampedStepIndex(initialStepIndex, currentServiceKind);
  let currentContext = hostPageContextForStep(currentStepIndex, currentServiceKind);
  const listeners = new Set<(context: HostPageContext) => void>();

  const publish = (context: HostPageContext) => {
    currentContext = context;
    listeners.forEach((listener) => listener(currentContext));
    return currentContext;
  };

  return {
    getCurrentContext: async () => currentContext,
    getCurrentContextSync: () => currentContext,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    setStepIndex: (index, kind = currentServiceKind) => {
      currentServiceKind = kind;
      currentStepIndex = clampedStepIndex(index, currentServiceKind);
      return publish(hostPageContextForStep(currentStepIndex, currentServiceKind));
    },
    simulatePageDrift: (index = currentStepIndex, kind = currentServiceKind) => {
      currentServiceKind = kind;
      currentStepIndex = clampedStepIndex(index, currentServiceKind);
      return publish(pageDriftContextForStep(currentStepIndex, currentServiceKind));
    },
    recoverToStep: (index, kind = currentServiceKind) => {
      currentServiceKind = kind;
      currentStepIndex = clampedStepIndex(index, currentServiceKind);
      return publish(hostPageContextForStep(currentStepIndex, currentServiceKind));
    }
  };
};
