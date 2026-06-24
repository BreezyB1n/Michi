export type ServiceKind = "backend-api" | "static-site";

export type Capability = {
  id: "cloudflare-workers" | "cloudflare-pages" | "cloudflare-dns";
  name: string;
  concept: string;
  explanation: string;
};

export type GuideStep = {
  id: string;
  title: string;
  action: string;
  purpose: string;
  completionCheck: string;
  targetId?: string;
  expectedRouteId?: string;
  criticalAction?: {
    label: string;
    impact: string;
  };
};

export type BlockingState = {
  id: "not-signed-in" | "permission-missing" | "page-drift";
  title: string;
  reason: string;
  recoveryAction: string;
};

export type PageState = {
  location: string;
  targetElement: string;
  evidence: string;
  completionSatisfied: boolean;
  blockingState?: BlockingState;
};

export type PageTarget = {
  id: string;
  label: string;
  role: "navigation" | "button" | "form" | "status" | "content";
  text: string;
  confidence: "high" | "medium" | "low";
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

export type PageSignal = {
  id: string;
  label: string;
  value: string;
  severity: "info" | "success" | "warning" | "error";
};

export type HostPageContext = {
  url: string;
  title: string;
  product: "cloudflare";
  locationLabel: string;
  routeId: string;
  detectedAt: string;
  targets: PageTarget[];
  signals: PageSignal[];
  blockingState?: BlockingState;
};

export type PageContextProvider = {
  getCurrentContext(): Promise<HostPageContext>;
  subscribe(listener: (context: HostPageContext) => void): () => void;
};

export type GuidePhase =
  | "intent"
  | "clarify"
  | "guide"
  | "confirm"
  | "recovery"
  | "complete";

export type GuideSession = {
  intent: string;
  serviceKind?: ServiceKind;
  selectedCapability?: Capability;
  followUpCapability?: Capability;
  steps: GuideStep[];
  activeStepIndex: number;
  pageState: PageState;
  phase: GuidePhase;
};
