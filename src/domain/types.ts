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
