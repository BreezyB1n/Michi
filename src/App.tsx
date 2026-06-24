import { useMemo, useState } from "react";
import {
  ArrowCounterClockwise,
  ArrowRight,
  CheckCircle,
  Circle,
  Cloud,
  Code,
  Database,
  FileText,
  GearSix,
  Globe,
  House,
  IconContext,
  Minus,
  Play,
  RocketLaunch,
  ShieldCheck,
  SidebarSimple,
  Sparkle,
  Stack,
  WarningCircle,
  X
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  advanceStep,
  applyHostPageContext,
  chooseServiceKind,
  confirmCriticalAction,
  resetSession,
  startSession,
  type HostPageContext,
  type GuideSession,
  type ServiceKind
} from "./domain/guideCore";
import { createCloudflareMockPageContextProvider } from "./domain/pageContextProvider";

const sampleIntent = "I want to build a small service that other people can access.";

const phaseLabels: Record<GuideSession["phase"], string> = {
  intent: "Intent",
  clarify: "Clarify",
  guide: "Guide",
  confirm: "Confirm",
  recovery: "Recovery",
  complete: "Complete"
};

const App = () => {
  const [intent, setIntent] = useState(sampleIntent);
  const [session, setSession] = useState<GuideSession>(() => resetSession());
  const [panelOpen, setPanelOpen] = useState(false);
  const [pageContextProvider] = useState(() => createCloudflareMockPageContextProvider());
  const [hostPageContext, setHostPageContext] = useState<HostPageContext>(() =>
    pageContextProvider.getCurrentContextSync()
  );
  const [pulseKey, setPulseKey] = useState(0);

  const currentStep = session.steps[session.activeStepIndex];
  const progress = useMemo(() => {
    if (!session.steps.length) {
      return "0 / 0";
    }

    return `${session.activeStepIndex + 1} / ${session.steps.length}`;
  }, [session.activeStepIndex, session.steps.length]);

  const updateSession = (nextSession: GuideSession) => {
    if (nextSession.pageState.completionSatisfied) {
      setPulseKey((value) => value + 1);
    }
    setSession(nextSession);
  };

  const updateFromContext = (
    baseSession: GuideSession,
    context = pageContextProvider.getCurrentContextSync()
  ) => {
    setHostPageContext(context);
    updateSession(applyHostPageContext(baseSession, context));
  };

  const handleStart = () => {
    updateSession(startSession(intent));
  };

  const handleServiceKind = (kind: ServiceKind) => {
    const nextSession = chooseServiceKind(session, kind);

    if (kind === "backend-api") {
      updateFromContext(nextSession, pageContextProvider.setStepIndex(nextSession.activeStepIndex));
      return;
    }

    updateSession(nextSession);
  };

  const handleAdvance = () => {
    const nextSession = advanceStep(session);

    if (nextSession.phase === "confirm" || nextSession.steps.length === 0) {
      updateSession(nextSession);
      return;
    }

    updateFromContext(
      nextSession,
      pageContextProvider.setStepIndex(nextSession.activeStepIndex)
    );
  };

  const handleConfirm = () => {
    const nextSession = confirmCriticalAction(session);

    updateFromContext(
      nextSession,
      pageContextProvider.setStepIndex(nextSession.activeStepIndex)
    );
  };

  const handleRecovery = () => {
    updateFromContext(session, pageContextProvider.recoverToStep(session.activeStepIndex));
  };

  const handleCheck = () => {
    updateFromContext(session);
  };

  const handlePageDrift = () => {
    updateFromContext(session, pageContextProvider.simulatePageDrift(session.activeStepIndex));
  };

  const handleReset = () => {
    setIntent(sampleIntent);
    setHostPageContext(pageContextProvider.recoverToStep(0));
    updateSession(resetSession());
  };

  return (
    <IconContext.Provider value={{ size: 18, weight: "duotone" }}>
      <main className="min-h-[100dvh] bg-background text-foreground">
        <section
          className="min-h-[100dvh] overflow-hidden bg-shell"
          aria-label="Michi browser extension demo"
        >
          <header
            className="grid h-12 grid-cols-[112px_minmax(180px,1fr)_112px] items-center gap-3 border-b border-border bg-shell px-3.5 max-[520px]:grid-cols-[minmax(0,1fr)_56px] max-[520px]:gap-2"
            aria-label="Browser chrome"
          >
            <div className="flex items-center gap-2 max-[520px]:hidden" aria-hidden="true">
              <span className="size-2.5 rounded-full bg-[oklch(0.7_0.14_24)]" />
              <span className="size-2.5 rounded-full bg-[oklch(0.78_0.14_83)]" />
              <span className="size-2.5 rounded-full bg-[oklch(0.7_0.13_150)]" />
            </div>
            <div className="flex h-8 items-center justify-center rounded-full border border-border bg-muted px-4 text-center text-[13px] font-medium text-muted-foreground max-[520px]:justify-start">
              dash.cloudflare.com
            </div>
            <div className="flex items-center justify-end gap-2 text-muted-foreground" aria-hidden="true">
              <SidebarSimple />
              <GearSix />
            </div>
          </header>

          <div
            className={cn(
              "grid min-h-[calc(100dvh-3rem)]",
              panelOpen
                ? "grid-cols-[minmax(0,1fr)_410px_58px] max-[980px]:grid-cols-1 max-[980px]:grid-rows-[minmax(470px,1fr)_auto_52px]"
                : "grid-cols-[minmax(0,1fr)_58px] max-[980px]:grid-cols-1 max-[980px]:grid-rows-[minmax(470px,1fr)_52px]"
            )}
          >
            <HostWebsite session={session} hostPageContext={hostPageContext} />
            {panelOpen ? (
              <aside
                className="grid min-w-0 grid-rows-[auto_minmax(0,1fr)_auto] border-l border-border bg-shell text-foreground max-[980px]:max-h-[68dvh] max-[980px]:border-l-0 max-[980px]:border-t"
                aria-label="Michi plugin panel"
              >
                <PluginHeader
                  session={session}
                  progress={progress}
                  onClose={() => setPanelOpen(false)}
                />
                <div
                  className="min-h-0 overflow-auto overscroll-contain bg-shell [scrollbar-width:thin]"
                  key={`${session.phase}-${session.activeStepIndex}-${session.serviceKind ?? "none"}`}
                >
                  {session.phase === "clarify" ? (
                    <ClarificationPanel intent={session.intent} onChoose={handleServiceKind} />
                  ) : (
                    <>
                      <GuidePanel
                        session={session}
                        currentStep={currentStep}
                        intent={intent}
                        onIntentChange={setIntent}
                        onStart={handleStart}
                      />
                      <PageStatePanel
                        session={session}
                        hostPageContext={hostPageContext}
                        pulseKey={pulseKey}
                      />
                    </>
                  )}
                </div>
                <ActionBar
                  session={session}
                  onAdvance={handleAdvance}
                  onConfirm={handleConfirm}
                  onRecover={handleRecovery}
                  onReset={handleReset}
                  onDrift={handlePageDrift}
                />
              </aside>
            ) : null}
            <PluginRail
              panelOpen={panelOpen}
              onOpen={() => setPanelOpen(true)}
              onCheck={handleCheck}
              onMinimize={() => setPanelOpen(false)}
            />
          </div>
        </section>
      </main>
    </IconContext.Provider>
  );
};

type HostWebsiteProps = {
  session: GuideSession;
  hostPageContext: HostPageContext;
};

const HostWebsite = ({ session, hostPageContext }: HostWebsiteProps) => (
  <section
    className="grid min-w-0 grid-cols-[216px_minmax(0,1fr)] overflow-hidden bg-shell text-foreground max-[1120px]:grid-cols-[178px_minmax(0,1fr)] max-[980px]:grid-cols-1"
    aria-label="Simulated host website"
  >
    <nav
      className="grid content-start gap-1.5 border-r border-border bg-sidebar px-2.5 py-7 max-[980px]:flex max-[980px]:items-center max-[980px]:gap-2 max-[980px]:overflow-x-auto max-[980px]:border-r-0 max-[980px]:border-b max-[980px]:p-3"
      aria-label="Cloudflare navigation"
    >
      <div className="mb-6 ml-2 grid size-11 place-items-center rounded-xl bg-primary text-sm font-extrabold tracking-tight text-primary-foreground shadow-sm max-[980px]:hidden">
        CF
      </div>
      <HostNavItem icon={<House />} label="Overview" />
      <HostNavItem icon={<Stack />} label="Workers & Pages" active />
      <HostNavItem icon={<Globe />} label="DNS" />
      <HostNavItem icon={<Database />} label="R2" />
      <HostNavItem icon={<ShieldCheck />} label="Security" />
    </nav>

    <section
      className="min-w-0 bg-shell p-7 max-[980px]:p-4"
      aria-label="Cloudflare page content"
    >
      <div className="mb-5 flex min-h-10 flex-wrap items-center gap-2.5">
        <Badge variant="outline" className="bg-card text-foreground">
          Account home
        </Badge>
        <Badge variant="neutral">Workers</Badge>
        <Badge variant="neutral">Production</Badge>
      </div>

      <div className="mb-6 flex items-start justify-between gap-5">
        <div>
          <p className="mb-2 font-mono text-[11px] font-semibold tracking-[0.16em] text-muted-foreground">
            Cloudflare console
          </p>
          <h2 className="m-0 text-balance text-3xl font-semibold tracking-[-0.025em] text-foreground max-[980px]:text-[1.9rem]">
            Workers & Pages
          </h2>
        </div>
        <Button type="button" variant="secondary">
          Create
        </Button>
      </div>

      <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(248px,0.8fr)] gap-4 max-[980px]:grid-cols-1">
        <Card className="min-h-[470px] border border-border p-6 max-[980px]:min-h-[300px] max-[520px]:p-4">
          <div className="mb-6 flex items-center justify-between gap-3">
            <Badge variant="outline" className="font-mono tracking-[0.16em]">
              Runtime
            </Badge>
            <span className="text-xs font-medium text-muted-foreground">HTTP services</span>
          </div>
          <h3 className="mb-4 max-w-[13ch] text-balance text-5xl font-semibold leading-[0.98] tracking-[-0.045em] text-foreground max-[1120px]:text-[2.7rem] max-[980px]:text-[2.2rem]">
            Create and deploy a Worker
          </h3>
          <p className="mb-6 max-w-[54ch] text-pretty text-sm leading-6 text-muted-foreground">
            Build a lightweight service, publish it to a Worker URL, then decide
            whether to connect a custom domain.
          </p>
          <div
            className="mb-6 grid grid-cols-3 gap-2.5 max-[980px]:grid-cols-1"
            aria-label="Workers runtime signals"
          >
            <MetricTile label="Edge" value="Global runtime" icon={<Cloud />} />
            <MetricTile label="API" value="Backend route" icon={<Code />} />
            <MetricTile label="DNS" value="Follow-up path" icon={<Globe />} />
          </div>
          <div className="flex max-w-xl items-center gap-2.5 rounded-lg border border-accent/35 bg-accent/10 px-3.5 py-3 text-sm font-semibold text-accent-foreground">
            <CheckCircle aria-hidden="true" />
            {session.phase !== "intent" && session.phase !== "clarify"
              ? "Michi highlighted the next dashboard control"
              : "Waiting for Michi"}
          </div>
        </Card>

        <Card className="overflow-hidden border border-border">
          <CardHeader className="border-b border-border">
            <CardTitle>Current page signal</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <dl className="grid">
              <StateRow
                label="Host context"
                value={
                  session.phase === "intent"
                    ? "No guide running"
                    : hostPageContext.routeId
                }
              />
              <StateRow
                label="Status"
                value={
                  hostPageContext.blockingState
                    ? hostPageContext.blockingState.title
                    : session.pageState.completionSatisfied
                      ? "Ready"
                      : "Needs check"
                }
              />
            </dl>
            <div className="mt-4 grid gap-2.5" aria-label="Recent console activity">
              {(session.phase === "intent"
                ? [
                    { id: "navigation-visible", label: "Navigation visible", severity: "info" },
                    { id: "create-action-available", label: "Create action available", severity: "info" },
                    { id: "guide-overlay-ready", label: "Guide overlay ready", severity: "info" }
                  ]
                : hostPageContext.signals
              ).map((signal) => (
                  <div
                    key={signal.id}
                    className="rounded-lg border border-accent/20 bg-accent/8 px-3 py-2.5 text-xs font-medium text-muted-foreground"
                  >
                    {signal.label}: {signal.severity}
                  </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  </section>
);

type HostNavItemProps = {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
};

const HostNavItem = ({ icon, label, active = false }: HostNavItemProps) => (
  <a
    href={`#${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
    className={cn(
      "flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted-foreground no-underline transition-[background-color,color] duration-150 max-[980px]:shrink-0 max-[980px]:whitespace-nowrap",
      active && "bg-background text-foreground shadow-sm"
    )}
  >
    {icon}
    {label}
  </a>
);

type MetricTileProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
};

const MetricTile = ({ icon, label, value }: MetricTileProps) => (
  <div className="min-w-0 rounded-lg border border-border bg-shell p-3">
    <div className="mb-2 flex items-center gap-2 text-foreground">
      {icon}
      <strong className="text-sm font-semibold">{label}</strong>
    </div>
    <span className="block text-xs leading-5 text-muted-foreground">{value}</span>
  </div>
);

type StateRowProps = {
  label: string;
  value: React.ReactNode;
  className?: string;
};

const StateRow = ({ label, value, className }: StateRowProps) => (
  <div className={cn("grid gap-1.5 border-b border-border py-3 last:border-b-0", className)}>
    <dt className="font-mono text-[11px] font-semibold text-muted-foreground">{label}</dt>
    <dd className="m-0 text-sm leading-6 text-foreground">{value}</dd>
  </div>
);

type PluginHeaderProps = {
  session: GuideSession;
  progress: string;
  onClose: () => void;
};

const PluginHeader = ({ session, progress, onClose }: PluginHeaderProps) => (
  <header className="grid grid-cols-[minmax(0,1fr)_40px] gap-2.5 border-b border-border bg-shell px-5 py-5 max-[520px]:px-4 max-[520px]:py-4">
    <div>
      <p className="mb-1.5 font-mono text-[11px] font-semibold tracking-[0.14em] text-muted-foreground">
        Guide Agent
      </p>
      <h1 className="m-0 text-2xl font-semibold leading-none tracking-[-0.035em] text-foreground max-[520px]:text-xl">
        Michi
      </h1>
    </div>
    <Button type="button" aria-label="Close Michi panel" variant="quiet" size="icon" onClick={onClose}>
      <X aria-hidden="true" />
    </Button>
    <div className="col-span-full mt-2 flex flex-wrap gap-2" aria-label="Current flow state">
      <Badge variant="outline">{phaseLabels[session.phase]}</Badge>
      <Badge variant="neutral">Step {progress}</Badge>
      <Badge variant={session.selectedCapability ? "accent" : "neutral"}>
        {session.selectedCapability ? "Mapped" : "No capability"}
      </Badge>
    </div>
  </header>
);

type ClarificationPanelProps = {
  intent: string;
  onChoose: (kind: ServiceKind) => void;
};

const ClarificationPanel = ({ intent, onChoose }: ClarificationPanelProps) => (
  <SectionCard aria-label="Service clarification">
    <div className="grid gap-2 rounded-lg border border-border bg-muted px-3 py-3">
      <span className="font-mono text-[11px] font-semibold text-muted-foreground">User intent</span>
      <p className="m-0 text-sm leading-6 text-foreground">{intent}</p>
    </div>
    <div className="my-4 h-px bg-border" />
    <SectionLabel>Path decision</SectionLabel>
    <h2 className="mb-2 text-balance text-xl font-semibold tracking-[-0.025em]">
      What kind of service are you building?
    </h2>
    <p className="mb-4 text-pretty text-sm leading-6 text-muted-foreground">
      Michi only asks questions that change the guide path. This split decides
      whether to route toward Workers or Pages.
    </p>
    <div className="grid gap-2.5">
      <ChoiceButton onClick={() => onChoose("backend-api")} title="Backend logic or API">
        Route to Workers / Compute
      </ChoiceButton>
      <ChoiceButton onClick={() => onChoose("static-site")} title="Static website">
        Acknowledge Pages and keep this demo on Workers
      </ChoiceButton>
    </div>
  </SectionCard>
);

type ChoiceButtonProps = {
  title: string;
  children: React.ReactNode;
  onClick: () => void;
};

const ChoiceButton = ({ title, children, onClick }: ChoiceButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    className="min-h-20 rounded-lg border border-border bg-card p-3.5 text-left shadow-sm transition-[background-color,border-color,transform] duration-150 hover:border-accent/35 hover:bg-accent/8 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
  >
    <span className="mb-1 block text-sm font-semibold text-foreground">{title}</span>
    <small className="text-sm leading-5 text-muted-foreground">{children}</small>
  </button>
);

type GuidePanelProps = {
  session: GuideSession;
  currentStep: GuideSession["steps"][number] | undefined;
  intent: string;
  onIntentChange: (intent: string) => void;
  onStart: () => void;
};

const GuidePanel = ({
  session,
  currentStep,
  intent,
  onIntentChange,
  onStart
}: GuidePanelProps) => {
  if (session.phase === "intent") {
    return (
      <SectionCard>
        <IntentPanel intent={intent} onIntentChange={onIntentChange} onStart={onStart} />
      </SectionCard>
    );
  }

  if (session.phase === "complete") {
    return (
      <SectionCard>
        <SectionLabel>Primary path complete</SectionLabel>
        <h2 className="mb-2 text-xl font-semibold tracking-[-0.025em]">Worker URL verified</h2>
        <p className="mb-4 text-sm leading-6 text-muted-foreground">
          The simulated Worker URL is reachable, so the primary guide path has
          reached the user's goal.
        </p>
        {session.followUpCapability ? (
          <div className="rounded-lg border border-border bg-muted p-3.5">
            <span className="mb-1 block font-mono text-[11px] font-semibold text-accent-foreground">
              {session.followUpCapability.concept}
            </span>
            <strong className="mb-2 block text-sm font-semibold">
              {session.followUpCapability.name}
            </strong>
            <p className="m-0 text-sm leading-6 text-muted-foreground">
              {session.followUpCapability.explanation}
            </p>
          </div>
        ) : null}
      </SectionCard>
    );
  }

  if (session.phase === "confirm" && currentStep?.criticalAction) {
    return (
      <SectionCard>
        <SectionLabel>Critical write action</SectionLabel>
        <h2 className="mb-2 text-xl font-semibold tracking-[-0.025em]">
          Confirm {currentStep.criticalAction.label}
        </h2>
        <p className="mb-4 text-sm leading-6 text-muted-foreground">
          {currentStep.criticalAction.impact}
        </p>
        <Callout icon={<ShieldCheck />} tone="accent">
          Important account-changing actions need explicit confirmation.
        </Callout>
      </SectionCard>
    );
  }

  if (session.phase === "recovery" && session.pageState.blockingState) {
    return (
      <SectionCard>
        <SectionLabel>Recovery step</SectionLabel>
        <h2 className="mb-2 text-xl font-semibold tracking-[-0.025em]">
          {session.pageState.blockingState.title}
        </h2>
        <p className="mb-4 text-sm leading-6 text-muted-foreground">
          {session.pageState.blockingState.reason}
        </p>
        <Callout icon={<WarningCircle />} tone="warning">
          {session.pageState.blockingState.recoveryAction}
        </Callout>
      </SectionCard>
    );
  }

  return (
    <SectionCard>
      <div className="mb-2 flex flex-wrap items-center gap-2 text-sm font-semibold text-accent-foreground">
        <Circle aria-hidden="true" size={14} weight="fill" />
        <span>{session.selectedCapability?.name ?? "Capability pending"}</span>
        <span className="text-foreground">{session.selectedCapability?.concept ?? "Unmapped"}</span>
      </div>
      <p className="mb-5 text-sm leading-6 text-muted-foreground">
        {session.selectedCapability?.explanation}
      </p>
      <div className="mb-3 flex items-start justify-between gap-3">
        <SectionLabel>Guide step</SectionLabel>
        <span className="grid size-9 place-items-center rounded-full border border-accent/30 bg-accent/10 text-sm font-bold tabular-nums text-accent-foreground">
          {session.steps.length ? session.activeStepIndex + 1 : 0}
        </span>
      </div>
      <h2 className="mb-4 text-balance text-xl font-semibold tracking-[-0.025em]">
        {currentStep?.title ?? "No active step"}
      </h2>
      <StepBlock title="Action" body={currentStep?.action} />
      <StepBlock title="Step purpose" body={currentStep?.purpose} />
      <StepBlock title="Completion check" body={currentStep?.completionCheck} />
    </SectionCard>
  );
};

type SectionCardProps = React.HTMLAttributes<HTMLDivElement>;

const SectionCard = ({ className, ...props }: SectionCardProps) => (
  <Card
    className={cn("m-5 border border-border p-5 max-[520px]:m-3 max-[520px]:p-4", className)}
    {...props}
  />
);

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-2 font-mono text-[11px] font-semibold tracking-[0.14em] text-muted-foreground">
    {children}
  </p>
);

type CalloutProps = {
  icon: React.ReactNode;
  children: React.ReactNode;
  tone: "accent" | "warning";
};

const Callout = ({ icon, children, tone }: CalloutProps) => (
  <div
    className={cn(
      "flex items-start gap-2.5 rounded-lg border p-3 text-sm font-medium leading-6",
      tone === "accent" && "border-accent/25 bg-accent/10 text-accent-foreground",
      tone === "warning" && "border-warning/30 bg-warning/14 text-warning-foreground"
    )}
  >
    <span className="mt-0.5 shrink-0">{icon}</span>
    <span>{children}</span>
  </div>
);

type IntentPanelProps = {
  intent: string;
  onIntentChange: (intent: string) => void;
  onStart: () => void;
};

const IntentPanel = ({ intent, onIntentChange, onStart }: IntentPanelProps) => (
  <div className="grid gap-3" aria-label="Intent entry">
    <label htmlFor="intent" className="font-mono text-[11px] font-semibold text-muted-foreground">
      User intent
    </label>
    <Textarea
      id="intent"
      value={intent}
      onChange={(event) => onIntentChange(event.target.value)}
      rows={5}
    />
    <Button type="button" variant="primary" onClick={onStart} className="justify-self-start">
      Start guide
      <ArrowRight aria-hidden="true" />
    </Button>
  </div>
);

type StepBlockProps = {
  title: string;
  body: string | undefined;
};

const StepBlock = ({ title, body }: StepBlockProps) => (
  <div className="border-t border-border py-3 first:border-t-0 first:pt-0">
    <h3 className="mb-1 font-mono text-[11px] font-semibold text-muted-foreground">{title}</h3>
    <p className="m-0 text-pretty text-sm leading-6 text-foreground">{body}</p>
  </div>
);

type PageStatePanelProps = {
  session: GuideSession;
  hostPageContext: HostPageContext;
  pulseKey: number;
};

const PageStatePanel = ({ session, hostPageContext, pulseKey }: PageStatePanelProps) => (
  <SectionCard className="border-accent/25 shadow-[0_16px_38px_rgb(24_110_180_/_0.08)]">
    <div className="mb-2 flex items-start justify-between gap-3">
      <div>
        <SectionLabel>Page check</SectionLabel>
        <h2 className="m-0 text-xl font-semibold tracking-[-0.025em]">Current state</h2>
      </div>
      <Badge variant={session.pageState.completionSatisfied ? "success" : "outline"}>
        {session.pageState.completionSatisfied ? "Check passed" : "Check pending"}
      </Badge>
    </div>

    <dl className="grid">
      <StateRow label="Location" value={session.pageState.location} />
      <StateRow label="Highlighted target" value={session.pageState.targetElement} />
      <StateRow
        label="Provider status"
        value={hostPageContext.blockingState ? "Blocked by page context" : "Synced"}
      />
      <StateRow
        label="Evidence"
        value={
          <span
            key={pulseKey}
            className={cn(
              "block text-muted-foreground",
              session.pageState.completionSatisfied && "animate-check-pulse"
            )}
          >
            {session.pageState.evidence}
          </span>
        }
      />
    </dl>
  </SectionCard>
);

type ActionBarProps = {
  session: GuideSession;
  onAdvance: () => void;
  onConfirm: () => void;
  onRecover: () => void;
  onReset: () => void;
  onDrift: () => void;
};

const ActionBar = ({
  session,
  onAdvance,
  onConfirm,
  onRecover,
  onReset,
  onDrift
}: ActionBarProps) => (
  <footer
    className="grid gap-2.5 border-t border-border bg-shell p-3 max-[520px]:grid-cols-2"
    aria-label="Guide actions"
  >
    <Button type="button" variant="secondary" onClick={onReset}>
      <ArrowCounterClockwise aria-hidden="true" />
      Reset
    </Button>
    {session.phase === "guide" ? (
      <>
        <Button type="button" variant="secondary" onClick={onDrift}>
          Simulate page drift
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={onAdvance}
          className="max-[520px]:col-span-full"
        >
          Advance guide
          <ArrowRight aria-hidden="true" />
        </Button>
      </>
    ) : null}
    {session.phase === "confirm" ? (
      <Button
        type="button"
        variant="primary"
        onClick={onConfirm}
        className="max-[520px]:col-span-full"
      >
        Confirm action
        <ShieldCheck aria-hidden="true" />
      </Button>
    ) : null}
    {session.phase === "recovery" ? (
      <Button
        type="button"
        variant="primary"
        onClick={onRecover}
        className="max-[520px]:col-span-full"
      >
        Recover and re-check
        <ArrowRight aria-hidden="true" />
      </Button>
    ) : null}
  </footer>
);

type PluginRailProps = {
  panelOpen: boolean;
  onOpen: () => void;
  onCheck: () => void;
  onMinimize: () => void;
};

const PluginRail = ({ panelOpen, onOpen, onCheck, onMinimize }: PluginRailProps) => (
  <nav
    className="grid content-start gap-2.5 border-l border-border bg-shell p-2 max-[980px]:grid-cols-3 max-[980px]:border-l-0 max-[980px]:border-t max-[980px]:p-1.5"
    aria-label="Michi tool rail"
  >
    <RailButton label="Guide" ariaLabel="Text guide" active={panelOpen} icon={<FileText />} onClick={onOpen} />
    <RailButton label="Check" ariaLabel="Run check" icon={<Play />} onClick={onCheck} />
    <RailButton label="Min" ariaLabel="Minimize panel" icon={<Minus />} onClick={onMinimize} />
  </nav>
);

type RailButtonProps = {
  label: string;
  ariaLabel: string;
  icon: React.ReactNode;
  active?: boolean;
  onClick: () => void;
};

const RailButton = ({ label, ariaLabel, icon, active = false, onClick }: RailButtonProps) => (
  <button
    type="button"
    aria-label={ariaLabel}
    onClick={onClick}
    className={cn(
      "grid min-h-12 place-items-center gap-0.5 rounded-lg border border-transparent text-muted-foreground transition-[background-color,border-color,color,transform] duration-150 hover:bg-muted active:scale-[0.98]",
      active && "border-accent/25 bg-accent/10 text-accent-foreground"
    )}
  >
    {icon}
    <span className="text-[11px] font-medium">{label}</span>
  </button>
);

export default App;
