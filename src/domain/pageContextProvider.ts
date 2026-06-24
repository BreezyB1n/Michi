import { blockingStates, pageStatesByStep, workersGuideSteps } from "./siteSkillPack";
import type {
  HostPageContext,
  PageContextProvider,
  PageSignal,
  PageTarget
} from "./types";

export type CloudflareMockPageContextProvider = PageContextProvider & {
  getCurrentContextSync(): HostPageContext;
  setStepIndex(index: number): HostPageContext;
  simulatePageDrift(index?: number): HostPageContext;
  recoverToStep(index: number): HostPageContext;
};

const routeIds = [
  "cloudflare.dashboard.home",
  "cloudflare.workers.overview",
  "cloudflare.workers.starter-editor",
  "cloudflare.workers.deploy-review",
  "cloudflare.workers.deploy-result"
] as const;

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
  }
];

const clampedStepIndex = (index: number) =>
  Math.min(Math.max(index, 0), workersGuideSteps.length - 1);

const detectedAtForStep = (index: number) =>
  new Date(Date.UTC(2026, 5, 24, 0, 0, clampedStepIndex(index))).toISOString();

const signalForStep = (index: number): PageSignal => {
  const pageState = pageStatesByStep[clampedStepIndex(index)];
  return {
    id: `completion-${workersGuideSteps[clampedStepIndex(index)].id}`,
    label: "Completion evidence",
    value: pageState.evidence,
    severity: pageState.completionSatisfied ? "success" : "info"
  };
};

export const hostPageContextForStep = (index: number): HostPageContext => {
  const stepIndex = clampedStepIndex(index);
  const pageState = pageStatesByStep[stepIndex];
  const step = workersGuideSteps[stepIndex];
  const target = pageTargets.find((candidate) => candidate.id === step.targetId);

  return {
    url: `https://dash.cloudflare.com/mock/${routeIds[stepIndex]}`,
    title: pageState.location,
    product: "cloudflare",
    locationLabel: pageState.location,
    routeId: routeIds[stepIndex],
    detectedAt: detectedAtForStep(stepIndex),
    targets: target ? [target] : [],
    signals: [signalForStep(stepIndex)]
  };
};

export const pageDriftContextForStep = (index: number): HostPageContext => {
  const stepIndex = clampedStepIndex(index);
  const step = workersGuideSteps[stepIndex];

  return {
    url: "https://dash.cloudflare.com/mock/unexpected-page",
    title: "Cloudflare dashboard / Unexpected page",
    product: "cloudflare",
    locationLabel: "Cloudflare dashboard / Unexpected page",
    routeId: "cloudflare.unexpected-page",
    detectedAt: detectedAtForStep(stepIndex),
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
  let currentStepIndex = clampedStepIndex(initialStepIndex);
  let currentContext = hostPageContextForStep(currentStepIndex);
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
    setStepIndex: (index) => {
      currentStepIndex = clampedStepIndex(index);
      return publish(hostPageContextForStep(currentStepIndex));
    },
    simulatePageDrift: (index = currentStepIndex) => {
      currentStepIndex = clampedStepIndex(index);
      return publish(pageDriftContextForStep(currentStepIndex));
    },
    recoverToStep: (index) => {
      currentStepIndex = clampedStepIndex(index);
      return publish(hostPageContextForStep(currentStepIndex));
    }
  };
};
