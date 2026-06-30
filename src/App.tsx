import { useEffect, useMemo, useRef, useState } from "react";
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
import { unsupportedPageContext } from "./domain/extensionPageContextProvider";
import { createMichiPageContextRuntime } from "./domain/pageContextRuntime";
import type { MichiPageContextRuntime } from "./domain/pageContextRuntime";
import {
  activityEventForConfirmation,
  activityEventForCriticalConfirmation,
  activityEventForIntentStart,
  activityEventForPageCheck,
  activityEventForRecovery,
  activityEventForReset,
  activityEventForServiceKind,
  appendActivityEvent,
  createActivityTimeline,
  resetActivityTimeline,
  type ActivityEvent,
  type ActivityEventInput,
  type ActivityTimeline
} from "./domain/activityTimeline";
import {
  commandHandoffForSession,
  type CommandAction,
  type CommandActionId,
  type CommandHandoff
} from "./domain/commandHandoff";
import {
  productBlockingStateCopy,
  productCapabilityCopy,
  productCompletionTitle,
  productGuideStepCopy,
  productLocationLabel,
  productPageStateCopy,
  productRouteLabel,
  productSignalCopy,
  productTargetLabel,
  sanitizeProviderText
} from "./domain/productPresentation";
import {
  recoveryGuidanceForState,
  type RecoveryGuidance
} from "./domain/recoveryGuidance";
import {
  readinessChecklistForState,
  type ReadinessChecklist
} from "./domain/readiness";

const sampleIntent = "I want to build a small service that other people can access.";

const phaseLabels: Record<GuideSession["phase"], string> = {
  intent: "Intent",
  clarify: "Clarify",
  guide: "Guide",
  confirm: "Confirm",
  recovery: "Recovery",
  complete: "Complete"
};

type AppProps = {
  pageContextRuntime?: MichiPageContextRuntime;
};

type ContextRequest = () => HostPageContext | PromiseLike<HostPageContext>;
type ContextActivityFactory = (input: {
  baseSession: GuideSession;
  context: HostPageContext;
  nextSession: GuideSession;
}) => ActivityEventInput | ActivityEventInput[] | undefined;

const isPromiseLike = <T,>(value: T | PromiseLike<T>): value is PromiseLike<T> =>
  typeof (value as PromiseLike<T>).then === "function";

const App = ({ pageContextRuntime: providedPageContextRuntime }: AppProps = {}) => {
  const [intent, setIntent] = useState(sampleIntent);
  const [session, setSession] = useState<GuideSession>(() => resetSession());
  const [panelOpen, setPanelOpen] = useState(false);
  const contextRequestIdRef = useRef(0);
  const [pageContextRuntime] = useState(
    () => providedPageContextRuntime ?? createMichiPageContextRuntime()
  );
  const [hostPageContext, setHostPageContext] = useState<HostPageContext>(() =>
    pageContextRuntime.getInitialContext()
  );
  const [activityTimeline, setActivityTimeline] = useState<ActivityTimeline>(() =>
    createActivityTimeline()
  );
  const [pulseKey, setPulseKey] = useState(0);
  const guideRailButtonRef = useRef<HTMLButtonElement>(null);
  const railRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const [panelFocusRequest, setPanelFocusRequest] = useState(0);

  const currentStep = session.steps[session.activeStepIndex];
  const readinessChecklist = useMemo(
    () =>
      readinessChecklistForState({
        panelOpen,
        phase: session.phase,
        context: hostPageContext
      }),
    [hostPageContext, panelOpen, session.phase]
  );
  const recoveryGuidance = useMemo(
    () =>
      session.phase === "recovery" && session.pageState.blockingState
        ? recoveryGuidanceForState({
            blockingState: session.pageState.blockingState,
            context: hostPageContext,
            serviceKind: session.serviceKind,
            step: currentStep
          })
        : undefined,
    [currentStep, hostPageContext, session.pageState.blockingState, session.phase, session.serviceKind]
  );
  const commandHandoff = useMemo(
    () => commandHandoffForSession(session, { recoveryGuidance }),
    [recoveryGuidance, session]
  );
  const progress = useMemo(() => {
    if (!session.steps.length) {
      return "0 / 0";
    }

    return `${session.activeStepIndex + 1} / ${session.steps.length}`;
  }, [session.activeStepIndex, session.steps.length]);

  const focusGuideRail = () => {
    guideRailButtonRef.current?.focus();
  };

  const openPanel = () => {
    setPanelOpen(true);
    setPanelFocusRequest((request) => request + 1);
  };

  const closePanel = () => {
    setPanelOpen(false);
    focusGuideRail();
  };

  useEffect(() => {
    if (!panelOpen) {
      return;
    }

    panelRef.current
      ?.querySelector<HTMLElement>("[data-primary-panel-focus]")
      ?.focus();
  }, [panelOpen, panelFocusRequest, session.phase, session.activeStepIndex, session.serviceKind]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.key !== "Escape" || !panelOpen) {
        return;
      }

      const target = event.target;
      if (
        !(target instanceof Node) ||
        (!panelRef.current?.contains(target) && !railRef.current?.contains(target))
      ) {
        return;
      }

      closePanel();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [panelOpen]);

  const updateSession = (nextSession: GuideSession) => {
    if (nextSession.pageState.completionSatisfied) {
      setPulseKey((value) => value + 1);
    }
    setSession(nextSession);
  };

  const recordActivity = (events: ActivityEventInput | ActivityEventInput[] | undefined) => {
    if (!events) {
      return;
    }

    const nextEvents = Array.isArray(events) ? events : [events];
    setActivityTimeline((timeline) =>
      nextEvents.reduce(
        (nextTimeline, event) => appendActivityEvent(nextTimeline, event),
        timeline
      )
    );
  };

  const nextContextRequestId = () => {
    contextRequestIdRef.current += 1;
    return contextRequestIdRef.current;
  };

  const runtimeErrorContextFromError = (error: unknown): HostPageContext =>
    unsupportedPageContext(
      error instanceof Error ? error.message : "Extension context request failed.",
      "error"
    );

  const recoveryGuidanceForCheckedSession = (
    checkedSession: GuideSession,
    context: HostPageContext
  ): RecoveryGuidance | undefined =>
    checkedSession.phase === "recovery" && checkedSession.pageState.blockingState
      ? recoveryGuidanceForState({
          blockingState: checkedSession.pageState.blockingState,
          context,
          serviceKind: checkedSession.serviceKind,
          step: checkedSession.steps[checkedSession.activeStepIndex]
        })
      : undefined;

  const activityEventForCheckedSession = (
    checkedSession: GuideSession,
    context: HostPageContext
  ) =>
    activityEventForPageCheck(checkedSession, {
      recoveryGuidance: recoveryGuidanceForCheckedSession(checkedSession, context)
    });

  const updateFromContext = (
    baseSession: GuideSession,
    readContext: ContextRequest = () => pageContextRuntime.getCurrentContext(),
    createActivityEvent: ContextActivityFactory = ({ context, nextSession }) =>
      activityEventForCheckedSession(nextSession, context)
  ) => {
    const requestId = nextContextRequestId();
    const applyContext = (context: HostPageContext) => {
      if (requestId !== contextRequestIdRef.current) {
        return;
      }

      const nextSession = applyHostPageContext(baseSession, context);
      setHostPageContext(context);
      updateSession(nextSession);
      recordActivity(createActivityEvent({ baseSession, context, nextSession }));
    };

    try {
      const contextResult = readContext();
      if (isPromiseLike(contextResult)) {
        void Promise.resolve(contextResult).then(applyContext).catch((error: unknown) => {
          applyContext(runtimeErrorContextFromError(error));
        });
        return;
      }

      applyContext(contextResult);
    } catch (error) {
      applyContext(runtimeErrorContextFromError(error));
    }
  };

  const updateHostContext = (readContext: ContextRequest) => {
    const requestId = nextContextRequestId();
    const applyContext = (context: HostPageContext) => {
      if (requestId === contextRequestIdRef.current) {
        setHostPageContext(context);
      }
    };

    try {
      const contextResult = readContext();
      if (isPromiseLike(contextResult)) {
        void Promise.resolve(contextResult).then(applyContext).catch((error: unknown) => {
          applyContext(runtimeErrorContextFromError(error));
        });
        return;
      }

      applyContext(contextResult);
    } catch (error) {
      applyContext(runtimeErrorContextFromError(error));
    }
  };

  const handleStart = () => {
    nextContextRequestId();
    updateSession(startSession(intent));
    recordActivity(activityEventForIntentStart(intent));
  };

  const handleServiceKind = (kind: ServiceKind) => {
    const nextSession = chooseServiceKind(session, kind);

    recordActivity(activityEventForServiceKind(kind));
    updateFromContext(
      nextSession,
      () => pageContextRuntime.syncGuideStep(nextSession.activeStepIndex, nextSession.serviceKind)
    );
  };

  const handleAdvance = () => {
    const nextSession = advanceStep(session);

    if (nextSession.phase === "confirm" || nextSession.steps.length === 0) {
      nextContextRequestId();
      updateSession(nextSession);
      if (nextSession.phase === "confirm") {
        recordActivity(activityEventForCriticalConfirmation(currentStep));
      }
      return;
    }

    updateFromContext(
      nextSession,
      () => pageContextRuntime.syncGuideStep(nextSession.activeStepIndex, nextSession.serviceKind)
    );
  };

  const handleConfirm = () => {
    const nextSession = confirmCriticalAction(session);

    recordActivity(activityEventForConfirmation(currentStep));
    updateFromContext(
      nextSession,
      () => pageContextRuntime.syncGuideStep(nextSession.activeStepIndex, nextSession.serviceKind)
    );
  };

  const handleRecovery = () => {
    updateFromContext(
      session,
      () => pageContextRuntime.recoverToStep(session.activeStepIndex, session.serviceKind),
      ({ baseSession, context, nextSession }) =>
        baseSession.phase === "recovery" && nextSession.phase === "guide"
          ? activityEventForRecovery(nextSession)
          : activityEventForCheckedSession(nextSession, context)
    );
  };

  const handleCheck = () => {
    updateFromContext(session);
  };

  const handlePageDrift = () => {
    updateFromContext(session, () =>
      pageContextRuntime.simulatePageDrift(session.activeStepIndex, session.serviceKind)
    );
  };

  const handleReset = () => {
    setIntent(sampleIntent);
    updateHostContext(() => pageContextRuntime.recoverToStep(0));
    updateSession(resetSession());
    setActivityTimeline(resetActivityTimeline(activityEventForReset()));
    setPanelOpen(true);
    setPanelFocusRequest((request) => request + 1);
  };

  const handleCommand = (actionId: CommandActionId) => {
    switch (actionId) {
      case "start-guide":
        handleStart();
        return;
      case "choose-backend-api":
        handleServiceKind("backend-api");
        return;
      case "choose-static-site":
        handleServiceKind("static-site");
        return;
      case "check-page":
        handleCheck();
        return;
      case "advance-guide":
      case "complete-guide":
        handleAdvance();
        return;
      case "confirm-action":
        handleConfirm();
        return;
      case "recover-and-recheck":
        handleRecovery();
        return;
      case "reset-guide":
        handleReset();
        return;
    }
  };

  return (
    <IconContext.Provider value={{ size: 18, weight: "duotone" }}>
      <main className="min-h-[100dvh] bg-background text-foreground">
        <section
          className="min-h-[100dvh] overflow-hidden bg-shell"
          aria-label="Michi browser extension surface"
        >
          <header
            className="grid h-12 grid-cols-[112px_minmax(180px,1fr)_112px] items-center gap-3 border-b border-border bg-background px-3.5 max-[520px]:grid-cols-[minmax(0,1fr)_56px] max-[520px]:gap-2"
            aria-label="Browser chrome"
          >
            <div className="flex items-center gap-2 max-[520px]:hidden" aria-hidden="true">
              <span className="size-2.5 rounded-full bg-[oklch(0.7_0.14_24)]" />
              <span className="size-2.5 rounded-full bg-[oklch(0.78_0.14_83)]" />
              <span className="size-2.5 rounded-full bg-[oklch(0.7_0.13_150)]" />
            </div>
            <div className="flex h-8 items-center justify-center rounded-full border border-border bg-muted px-4 text-center text-[13px] font-medium text-muted-foreground max-[520px]:justify-start">
              active.page / guided task
            </div>
            <div className="flex items-center justify-end gap-2 text-muted-foreground" aria-hidden="true">
              <SidebarSimple />
              <GearSix />
            </div>
          </header>

          <div
            className={cn(
              "grid h-[calc(100dvh-3rem)] min-h-0 overflow-hidden",
              panelOpen
                ? "grid-cols-[minmax(0,1fr)_410px_58px] max-[980px]:grid-cols-1 max-[980px]:grid-rows-[minmax(0,1fr)_auto_52px]"
                : "grid-cols-[minmax(0,1fr)_58px] max-[980px]:grid-cols-1 max-[980px]:grid-rows-[minmax(0,1fr)_52px]"
            )}
          >
            <CurrentPagePreview session={session} hostPageContext={hostPageContext} />
            {panelOpen ? (
              <aside
                ref={panelRef}
                className="grid h-full max-h-full min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden border-l border-black/20 bg-primary text-primary-foreground shadow-[0_0_0_1px_rgb(255_255_255_/_0.05)_inset] max-[980px]:max-h-[68dvh] max-[980px]:border-l-0 max-[980px]:border-t"
                aria-label="Michi side panel"
              >
                <PluginHeader
                  session={session}
                  hostPageContext={hostPageContext}
                  progress={progress}
                  onClose={closePanel}
                />
                <div
                  className="min-h-0 overflow-auto overscroll-contain bg-primary [scrollbar-width:thin]"
                  key={`${session.phase}-${session.activeStepIndex}-${session.serviceKind ?? "none"}`}
                >
                  {session.phase === "clarify" ? (
                    <>
                      <ClarificationPanel intent={session.intent} onChoose={handleServiceKind} />
                      <CommandHandoffPanel handoff={commandHandoff} onCommand={handleCommand} />
                    </>
                  ) : (
                    <>
                      <GuidePanel
                        session={session}
                        currentStep={currentStep}
                        hostPageContext={hostPageContext}
                        recoveryGuidance={recoveryGuidance}
                        readinessChecklist={readinessChecklist}
                        intent={intent}
                        onIntentChange={setIntent}
                        onStart={handleStart}
                      />
                      <CommandHandoffPanel handoff={commandHandoff} onCommand={handleCommand} />
                      <PageStatePanel
                        session={session}
                        hostPageContext={hostPageContext}
                        pulseKey={pulseKey}
                      />
                    </>
                  )}
                  <ActivityTimelinePanel timeline={activityTimeline} />
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
              guideButtonRef={guideRailButtonRef}
              railRef={railRef}
              onOpen={openPanel}
              onCheck={handleCheck}
              onMinimize={closePanel}
            />
          </div>
        </section>
      </main>
    </IconContext.Provider>
  );
};

const statusLabelForSession = (session: GuideSession, hostPageContext: HostPageContext) => {
  if (session.pageState.blockingState?.id === "extension-runtime-unavailable") {
    return "Extension runtime error";
  }

  if (session.pageState.blockingState) {
    return productBlockingStateCopy(session.pageState.blockingState).title;
  }

  if (hostPageContext.blockingState) {
    return productBlockingStateCopy(hostPageContext.blockingState).title;
  }

  return session.pageState.completionSatisfied ? "Ready" : "Needs check";
};

type HostWebsiteProps = {
  session: GuideSession;
  hostPageContext: HostPageContext;
};

const CurrentPagePreview = ({ session, hostPageContext }: HostWebsiteProps) => (
  <section
    className="grid min-h-0 min-w-0 grid-cols-[216px_minmax(0,1fr)] overflow-hidden bg-shell text-foreground max-[1120px]:grid-cols-[178px_minmax(0,1fr)] max-[980px]:grid-cols-1"
    aria-label="Current page preview"
  >
    <nav
      className="grid content-start gap-1.5 border-r border-border bg-sidebar px-2.5 py-7 max-[980px]:flex max-[980px]:items-center max-[980px]:gap-2 max-[980px]:overflow-x-auto max-[980px]:border-r-0 max-[980px]:border-b max-[980px]:p-3"
      aria-label="Workspace navigation"
    >
      <div className="mb-6 ml-2 grid size-11 place-items-center rounded-xl bg-primary text-sm font-extrabold tracking-tight text-primary-foreground shadow-sm max-[980px]:hidden">
        pg
      </div>
      <HostNavItem icon={<House />} label="Overview" />
      <HostNavItem icon={<Stack />} label="Build area" active />
      <HostNavItem icon={<Globe />} label="Domains" />
      <HostNavItem icon={<Database />} label="Data" />
      <HostNavItem icon={<ShieldCheck />} label="Access" />
    </nav>

    <section
      className="min-w-0 overflow-auto bg-shell p-7 max-[980px]:p-4"
      aria-label="Current page content"
    >
      <HostWebsiteContent session={session} hostPageContext={hostPageContext} />
    </section>
  </section>
);

const HostWebsiteContent = ({ session, hostPageContext }: HostWebsiteProps) => {
  const isStaticSite = session.serviceKind === "static-site";
  const targetLabel = productPageStateCopy(session.pageState).targetElement;
  const showTargetCallout =
    session.phase !== "intent" &&
    session.phase !== "clarify" &&
    session.phase !== "recovery" &&
    session.phase !== "complete" &&
    !session.pageState.blockingState &&
    !hostPageContext.blockingState &&
    targetLabel !== "No target detected";

  return (
    <>
      <div className="mb-5 flex min-h-10 flex-wrap items-center gap-2.5">
        <Badge variant="outline" className="bg-card text-foreground">
          Active workspace
        </Badge>
        <Badge variant="neutral">{isStaticSite ? "Site path" : "Service path"}</Badge>
        <Badge variant="neutral">Local proof</Badge>
      </div>

      <div className="mb-6 flex items-start justify-between gap-5">
        <div>
          <p className="mb-2 font-mono text-[11px] font-semibold tracking-[0.16em] text-muted-foreground">
            Active page preview
          </p>
          <h2 className="m-0 text-balance text-3xl font-semibold tracking-[-0.025em] text-foreground max-[980px]:text-[1.9rem]">
            Build area
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
              Guided route
            </Badge>
            <span className="text-xs font-medium text-muted-foreground">Reachable result</span>
          </div>
          <h3 className="mb-4 max-w-[13ch] text-balance text-5xl font-semibold leading-[0.98] tracking-[-0.045em] text-foreground max-[1120px]:text-[2.7rem] max-[980px]:text-[2.2rem]">
            {isStaticSite ? "Create and publish a site" : "Create and deploy a service"}
          </h3>
          <p className="mb-6 max-w-[54ch] text-pretty text-sm leading-6 text-muted-foreground">
            {isStaticSite
              ? "Publish a static website to a reachable URL, then decide whether to connect a custom domain."
              : "Build a lightweight endpoint, publish it to a reachable URL, then decide whether to connect a custom domain."}
          </p>
          <div
            className="mb-6 grid grid-cols-3 gap-2.5 max-[980px]:grid-cols-1"
            aria-label={isStaticSite ? "Site publishing signals" : "Service runtime signals"}
          >
            <MetricTile label="Scope" value={isStaticSite ? "Static output" : "Runtime logic"} icon={<Cloud />} />
            <MetricTile label="Route" value={isStaticSite ? "Website URL" : "Service URL"} icon={<Code />} />
            <MetricTile label="Share" value="Domain follow-up" icon={<Globe />} />
          </div>
          <div className="flex max-w-xl items-center gap-2.5 rounded-lg border border-accent/35 bg-accent/10 px-3.5 py-3 text-sm font-semibold text-accent-foreground">
            <CheckCircle aria-hidden="true" />
            {session.phase !== "intent" && session.phase !== "clarify"
              ? "Michi highlighted the next page control"
              : "Waiting for Michi"}
          </div>
          {showTargetCallout ? (
            <div
              aria-label="Target callout"
              className="mt-3 max-w-sm rounded-lg border border-accent/35 bg-card px-3.5 py-3 text-sm shadow-sm"
            >
              <strong className="mb-1 block font-semibold text-foreground">{targetLabel}</strong>
              <span className="block text-xs leading-5 text-muted-foreground">
                Michi is checking this target for the active guide step.
              </span>
            </div>
          ) : null}
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
                    : productRouteLabel(hostPageContext.routeId)
                }
              />
              <StateRow
                label="Status"
                value={statusLabelForSession(session, hostPageContext)}
              />
            </dl>
            <div className="mt-4 grid gap-2.5" aria-label="Recent console activity">
              {(session.phase === "intent"
                ? [
                    {
                      id: "navigation-visible",
                      label: "Navigation visible",
                      value: "Navigation visible",
                      severity: "info"
                    },
                    {
                      id: "create-action-available",
                      label: "Create action available",
                      value: "Create action available",
                      severity: "info"
                    },
                    {
                      id: "guide-overlay-ready",
                      label: "Michi rail ready",
                      value: "Michi rail ready",
                      severity: "info"
                    }
                  ]
                : hostPageContext.signals
              ).map((signal) => (
                  <div
                    key={signal.id}
                    className="rounded-lg border border-accent/20 bg-accent/8 px-3 py-2.5 text-xs font-medium text-muted-foreground"
                  >
                    {productSignalCopy(signal).label}: {signal.severity}
                  </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

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
  <div className={cn("grid gap-1.5 border-b border-current/10 py-3 last:border-b-0", className)}>
    <dt className="font-mono text-[11px] font-semibold text-current opacity-50">{label}</dt>
    <dd className="m-0 text-sm leading-6 text-current">{value}</dd>
  </div>
);

type PluginHeaderProps = {
  session: GuideSession;
  hostPageContext: HostPageContext;
  progress: string;
  onClose: () => void;
};

const PluginHeader = ({ session, hostPageContext, progress, onClose }: PluginHeaderProps) => (
  <header className="grid grid-cols-[minmax(0,1fr)_40px] gap-2.5 border-b border-white/10 bg-primary px-5 py-5 max-[520px]:px-4 max-[520px]:py-4">
    <div>
      <p className="mb-1.5 font-mono text-[11px] font-semibold tracking-[0.14em] text-white/50">
        Michi agent
      </p>
      <h1 className="m-0 text-2xl font-semibold leading-none tracking-[-0.035em] text-primary-foreground max-[520px]:text-xl">
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
      <Badge variant="outline">{productRouteLabel(hostPageContext.routeId)}</Badge>
    </div>
  </header>
);

type ClarificationPanelProps = {
  intent: string;
  onChoose: (kind: ServiceKind) => void;
};

const ClarificationPanel = ({ intent, onChoose }: ClarificationPanelProps) => (
  <SectionCard aria-label="Service clarification">
    <div className="grid gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-3 py-3">
      <span className="font-mono text-[11px] font-semibold text-white/45">User intent</span>
      <p className="m-0 text-sm leading-6 text-primary-foreground">{intent}</p>
    </div>
    <div className="my-4 h-px bg-white/10" />
    <SectionLabel>Path decision</SectionLabel>
    <h2 className="mb-2 text-balance text-xl font-semibold tracking-[-0.025em]">
      What kind of service are you building?
    </h2>
    <p className="mb-4 text-pretty text-sm leading-6 text-white/60">
      Michi only asks questions that change the guide path. This split decides
      whether to route toward a service runtime or a static publishing path.
    </p>
    <div className="grid gap-2.5">
      <ChoiceButton onClick={() => onChoose("backend-api")} title="Backend logic or API">
        Route to a deployable service path
      </ChoiceButton>
      <ChoiceButton onClick={() => onChoose("static-site")} title="Static website">
        Route to a site publishing path
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
    className="min-h-20 rounded-lg border border-white/10 bg-white/[0.06] p-3.5 text-left shadow-sm transition-[background-color,border-color,transform] duration-150 hover:border-accent/45 hover:bg-accent/16 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
  >
    <span className="mb-1 block text-sm font-semibold text-primary-foreground">{title}</span>
    <small className="text-sm leading-5 text-white/58">{children}</small>
  </button>
);

type GuidePanelProps = {
  session: GuideSession;
  currentStep: GuideSession["steps"][number] | undefined;
  hostPageContext: HostPageContext;
  recoveryGuidance?: RecoveryGuidance;
  readinessChecklist: ReadinessChecklist;
  intent: string;
  onIntentChange: (intent: string) => void;
  onStart: () => void;
};

const GuidePanel = ({
  session,
  currentStep,
  hostPageContext,
  recoveryGuidance,
  readinessChecklist,
  intent,
  onIntentChange,
  onStart
}: GuidePanelProps) => {
  const displayStep = productGuideStepCopy(currentStep);
  const displayCapability = productCapabilityCopy(session.selectedCapability, session.serviceKind);

  if (session.phase === "intent") {
    return (
      <SectionCard>
        <IntentPanel intent={intent} onIntentChange={onIntentChange} onStart={onStart} />
        <ReadinessPanel checklist={readinessChecklist} />
      </SectionCard>
    );
  }

  if (session.phase === "complete") {
    const followUpCapability = productCapabilityCopy(session.followUpCapability);

    return (
      <SectionCard>
        <SectionLabel>Primary path complete</SectionLabel>
        <h2 className="mb-2 text-xl font-semibold tracking-[-0.025em]">
          {productCompletionTitle(session.serviceKind)}
        </h2>
        <p className="mb-4 text-sm leading-6 text-white/60">
          The generated URL is reachable, so the primary guide path has reached the user's goal.
        </p>
        {session.followUpCapability ? (
          <div className="rounded-lg border border-white/10 bg-white/[0.06] p-3.5">
            <span className="mb-1 block font-mono text-[11px] font-semibold text-accent">
              {followUpCapability.concept}
            </span>
            <strong className="mb-2 block text-sm font-semibold">
              {followUpCapability.name}
            </strong>
            <p className="m-0 text-sm leading-6 text-white/60">
              {followUpCapability.explanation}
            </p>
          </div>
        ) : null}
      </SectionCard>
    );
  }

  if (session.phase === "confirm" && displayStep?.criticalAction) {
    return (
      <SectionCard>
        <SectionLabel>Critical write action</SectionLabel>
        <h2 className="mb-2 text-xl font-semibold tracking-[-0.025em]">
          Confirm {displayStep.criticalAction.label}
        </h2>
        <p className="mb-4 text-sm leading-6 text-white/60">
          {displayStep.criticalAction.impact}
        </p>
        <Callout icon={<ShieldCheck />} tone="accent">
          Important account-changing actions need explicit confirmation.
        </Callout>
      </SectionCard>
    );
  }

  if (session.phase === "recovery" && session.pageState.blockingState) {
    const guidance =
      recoveryGuidance ??
      recoveryGuidanceForState({
        blockingState: session.pageState.blockingState,
        context: hostPageContext,
        serviceKind: session.serviceKind,
        step: currentStep
      });

    return (
      <SectionCard>
        <SectionLabel>Recovery step</SectionLabel>
        <h2 className="mb-2 text-xl font-semibold tracking-[-0.025em]">
          {guidance.title}
        </h2>
        <p className="mb-4 text-sm leading-6 text-white/60">
          {guidance.reason}
        </p>
        <p className="mb-4 text-sm leading-6 text-white/60">
          {guidance.impact}
        </p>
        <Callout icon={<WarningCircle />} tone="warning">
          {guidance.action}
        </Callout>
      </SectionCard>
    );
  }

  return (
    <SectionCard>
      <div className="mb-2 flex flex-wrap items-center gap-2 text-sm font-semibold text-accent-foreground">
        <Circle aria-hidden="true" size={14} weight="fill" />
        <span>{displayCapability.name}</span>
        <span className="text-primary-foreground">{displayCapability.concept}</span>
      </div>
      <p className="mb-5 text-sm leading-6 text-white/60">
        {displayCapability.explanation}
      </p>
      <div className="mb-3 flex items-start justify-between gap-3">
        <SectionLabel>Guide step</SectionLabel>
        <span className="grid size-9 place-items-center rounded-full border border-accent/30 bg-accent/10 text-sm font-bold tabular-nums text-accent-foreground">
          {session.steps.length ? session.activeStepIndex + 1 : 0}
        </span>
      </div>
      <h2 className="mb-4 text-balance text-xl font-semibold tracking-[-0.025em]">
        {displayStep?.title ?? "No active step"}
      </h2>
      <StepBlock title="Action" body={displayStep?.action} />
      <StepBlock title="Step purpose" body={displayStep?.purpose} />
      <StepBlock title="Completion check" body={displayStep?.completionCheck} />
    </SectionCard>
  );
};

type SectionCardProps = React.HTMLAttributes<HTMLDivElement>;

const SectionCard = ({ className, ...props }: SectionCardProps) => (
  <Card
    className={cn(
      "m-5 border border-white/10 bg-white/[0.055] p-5 text-primary-foreground shadow-none max-[520px]:m-3 max-[520px]:p-4",
      className
    )}
    {...props}
  />
);

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-2 font-mono text-[11px] font-semibold tracking-[0.14em] text-white/45">
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
      tone === "accent" && "border-accent/35 bg-accent/18 text-primary-foreground",
      tone === "warning" && "border-warning/35 bg-warning/18 text-primary-foreground"
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
    <label htmlFor="intent" className="font-mono text-[11px] font-semibold text-white/50">
      User intent
    </label>
    <Textarea
      data-primary-panel-focus
      id="intent"
      value={intent}
      onChange={(event) => onIntentChange(event.target.value)}
      rows={5}
      className="border-white/10 bg-white/[0.06] text-primary-foreground shadow-none placeholder:text-white/40"
    />
    <Button type="button" variant="primary" onClick={onStart} className="justify-self-start">
      Start guide
      <ArrowRight aria-hidden="true" />
    </Button>
  </div>
);

const readinessToneClassName: Record<ReadinessChecklist["items"][number]["tone"], string> = {
  ready: "border-success/32 bg-success/12 text-primary-foreground",
  pending: "border-accent/32 bg-accent/12 text-primary-foreground",
  warning: "border-warning/38 bg-warning/14 text-primary-foreground"
};

const ReadinessPanel = ({ checklist }: { checklist: ReadinessChecklist }) =>
  checklist.visible ? (
    <section aria-label={checklist.title} className="mt-5 border-t border-white/10 pt-4">
      <SectionLabel>{checklist.title}</SectionLabel>
      <div className="grid gap-2">
        {checklist.items.map((item) => (
          <div
            key={item.id}
            className={cn("rounded-lg border px-3 py-2.5", readinessToneClassName[item.tone])}
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <strong className="text-sm font-semibold">{item.label}</strong>
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-current/55">
                {item.tone}
              </span>
            </div>
            <p className="m-0 text-xs leading-5 text-current/72">{item.detail}</p>
          </div>
        ))}
      </div>
    </section>
  ) : null;

type StepBlockProps = {
  title: string;
  body: string | undefined;
};

const StepBlock = ({ title, body }: StepBlockProps) => (
  <div className="border-t border-white/10 py-3 first:border-t-0 first:pt-0">
    <h3 className="mb-1 font-mono text-[11px] font-semibold text-white/45">{title}</h3>
    <p className="m-0 text-pretty text-sm leading-6 text-primary-foreground">{body}</p>
  </div>
);

type CommandHandoffPanelProps = {
  handoff: CommandHandoff;
  onCommand: (actionId: CommandActionId) => void;
};

const commandToneClassName: Record<CommandHandoff["tone"], string> = {
  neutral: "border-white/10 bg-white/[0.055]",
  primary: "border-accent/34 bg-accent/12",
  success: "border-success/32 bg-success/12",
  warning: "border-warning/38 bg-warning/14"
};

const CommandHandoffPanel = ({ handoff, onCommand }: CommandHandoffPanelProps) => (
  <SectionCard
    aria-label="Command handoff"
    className={cn("border p-0", commandToneClassName[handoff.tone])}
  >
    <div className="grid gap-4 p-5 max-[520px]:p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <SectionLabel>Command handoff</SectionLabel>
          <h2 className="m-0 text-balance text-xl font-semibold tracking-[-0.025em]">
            {handoff.title}
          </h2>
        </div>
        <Badge variant={handoff.tone === "warning" ? "warning" : handoff.tone === "success" ? "success" : "accent"}>
          Recommended
        </Badge>
      </div>
      <p className="m-0 break-words text-pretty text-sm leading-6 text-white/64 [overflow-wrap:anywhere]">
        {handoff.detail}
      </p>
      <div className="grid gap-2" aria-label="Recommended commands">
        <CommandButton action={handoff.primaryAction} onCommand={onCommand} primary />
        {handoff.secondaryActions.length ? (
          <div className="grid grid-cols-2 gap-2 max-[520px]:grid-cols-1">
            {handoff.secondaryActions.map((action) => (
              <CommandButton key={action.id} action={action} onCommand={onCommand} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  </SectionCard>
);

type CommandButtonProps = {
  action: CommandAction;
  onCommand: (actionId: CommandActionId) => void;
  primary?: boolean;
};

const CommandButton = ({ action, onCommand, primary = false }: CommandButtonProps) => (
  <Button
    data-primary-panel-focus={primary ? true : undefined}
    type="button"
    variant={primary ? "primary" : "secondary"}
    onClick={() => onCommand(action.id)}
    className={cn(
      "min-w-0 justify-between whitespace-normal text-left leading-5",
      primary && action.tone === "warning" && "border-warning/35 bg-warning/22 hover:bg-warning/26",
      primary && action.tone === "success" && "border-success/35 bg-success/18 hover:bg-success/24",
      !primary && "border-white/12 bg-white/[0.06] text-primary-foreground hover:bg-white/[0.1]"
    )}
    aria-label={action.label}
  >
    <span className="min-w-0 break-words [overflow-wrap:anywhere]">{action.label}</span>
    <ArrowRight aria-hidden="true" className="shrink-0" />
  </Button>
);

type PageStatePanelProps = {
  session: GuideSession;
  hostPageContext: HostPageContext;
  pulseKey: number;
};

const PageStatePanel = ({ session, hostPageContext, pulseKey }: PageStatePanelProps) => (
  <SectionCard className="border-accent/30 shadow-[0_16px_38px_rgb(24_110_180_/_0.08)]">
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
      <StateRow label="Location" value={productPageStateCopy(session.pageState).location} />
      <StateRow
        label="Highlighted target"
        value={productPageStateCopy(session.pageState).targetElement}
      />
      <StateRow
        label="Check status"
        value={
          session.pageState.blockingState
            ? session.pageState.blockingState.id === "extension-runtime-unavailable"
              ? "Extension runtime error"
              : "Check needs recovery"
            : hostPageContext.blockingState
              ? "Check needs recovery"
              : "Page check synced"
        }
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
            {productPageStateCopy(session.pageState).evidence}
          </span>
        }
      />
    </dl>
  </SectionCard>
);

type ActivityTimelinePanelProps = {
  timeline: ActivityTimeline;
};

const ActivityTimelinePanel = ({ timeline }: ActivityTimelinePanelProps) => {
  const visibleEvents = timeline.events.slice(-7).reverse();

  return (
    <SectionCard aria-label="Activity history" className="mb-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <SectionLabel>Activity</SectionLabel>
          <h2 className="m-0 text-xl font-semibold tracking-[-0.025em]">
            Session history
          </h2>
        </div>
        <Badge variant="outline">{timeline.events.length} events</Badge>
      </div>
      {visibleEvents.length ? (
        <ol className="grid gap-2.5" aria-label="Recent activity events">
          {visibleEvents.map((event) => (
            <ActivityTimelineItem key={event.id} event={event} />
          ))}
        </ol>
      ) : (
        <div className="rounded-lg border border-white/10 bg-white/[0.055] px-3.5 py-3 text-sm leading-6 text-white/60">
          No activity yet. Start a guide to see Michi's checks and decisions.
        </div>
      )}
    </SectionCard>
  );
};

type ActivityTimelineItemProps = {
  event: ActivityEvent;
};

const activityToneClassName: Record<ActivityEvent["tone"], string> = {
  info: "border-white/12 bg-white/[0.055] text-white/70",
  success: "border-success/35 bg-success/15 text-primary-foreground",
  warning: "border-warning/35 bg-warning/16 text-primary-foreground",
  error: "border-warning/50 bg-warning/20 text-primary-foreground"
};

const ActivityTimelineItem = ({ event }: ActivityTimelineItemProps) => (
  <li
    className={cn(
      "grid grid-cols-[32px_minmax(0,1fr)] gap-3 rounded-lg border p-3",
      activityToneClassName[event.tone]
    )}
  >
    <span className="grid size-8 place-items-center rounded-full border border-current/20 text-xs font-semibold tabular-nums text-current/85">
      {event.sequence}
    </span>
    <div className="min-w-0">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <strong className="text-sm font-semibold text-primary-foreground">{event.title}</strong>
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-current/50">
          {event.tone}
        </span>
      </div>
      <p className="m-0 break-words text-pretty text-xs leading-5 text-current/75 [overflow-wrap:anywhere]">
        {event.detail}
      </p>
    </div>
  </li>
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
    className="grid gap-2.5 border-t border-white/10 bg-primary p-3 max-[520px]:grid-cols-2"
    aria-label="Guide actions"
  >
    <Button
      type="button"
      variant="secondary"
      onClick={onReset}
      className="border-white/12 bg-white/[0.06] text-primary-foreground hover:bg-white/[0.1]"
    >
      <ArrowCounterClockwise aria-hidden="true" />
      Reset
    </Button>
    {session.phase === "guide" ? (
      <>
        <Button
          type="button"
          variant="secondary"
          onClick={onDrift}
          className="border-white/12 bg-white/[0.06] text-primary-foreground hover:bg-white/[0.1]"
        >
          Show page drift
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
        Recover now
        <ArrowRight aria-hidden="true" />
      </Button>
    ) : null}
  </footer>
);

type PluginRailProps = {
  panelOpen: boolean;
  guideButtonRef: React.Ref<HTMLButtonElement>;
  railRef: React.Ref<HTMLElement>;
  onOpen: () => void;
  onCheck: () => void;
  onMinimize: () => void;
};

const PluginRail = ({
  panelOpen,
  guideButtonRef,
  railRef,
  onOpen,
  onCheck,
  onMinimize
}: PluginRailProps) => (
  <nav
    ref={railRef}
    className="grid content-start gap-2.5 border-l border-border bg-background p-2 max-[980px]:grid-cols-3 max-[980px]:border-l-0 max-[980px]:border-t max-[980px]:p-1.5"
    aria-label="Michi tool rail"
  >
    <RailButton
      buttonRef={guideButtonRef}
      label="Guide"
      ariaLabel="Guide"
      active={panelOpen}
      icon={<FileText />}
      onClick={onOpen}
    />
    <RailButton label="Check" ariaLabel="Check page" icon={<Play />} onClick={onCheck} />
    <RailButton label="Min" ariaLabel="Minimize panel" icon={<Minus />} onClick={onMinimize} />
  </nav>
);

type RailButtonProps = {
  label: string;
  ariaLabel: string;
  icon: React.ReactNode;
  active?: boolean;
  buttonRef?: React.Ref<HTMLButtonElement>;
  onClick: () => void;
};

const RailButton = ({
  label,
  ariaLabel,
  icon,
  active = false,
  buttonRef,
  onClick
}: RailButtonProps) => (
  <button
    ref={buttonRef}
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
