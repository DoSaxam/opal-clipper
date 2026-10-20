"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  House,
  Scissors,
  Timer,
  Flame,
  Download,
  type LucideIcon,
} from "lucide-react";
import { BackgroundFX } from "./BackgroundFX";
import { HomeScreen } from "./HomeScreen";
import { TimestampsScreen } from "./TimestampsScreen";
import { ClipsScreen } from "./ClipsScreen";
import { QueueScreen } from "./QueueScreen";
import { InstallPrompt, useInstallState } from "./InstallPrompt";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useOpal, startPolling, type TabKey } from "@/lib/clipper/store";
import { cn } from "@/lib/utils";

const NAV: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: "home", label: "Home", icon: House },
  { key: "clips", label: "My Clips", icon: Scissors },
  { key: "queue", label: "Timer", icon: Timer },
];

export function AppShell() {
  const tab = useOpal((s) => s.tab);
  const screen = useOpal((s) => s.screen);
  const loaded = useOpal((s) => s.loaded);
  const clips = useOpal((s) => s.clips);
  const renders = useOpal((s) => s.renders);
  const stats = useOpal((s) => s.stats);
  const setTab = useOpal((s) => s.setTab);

  const activeJobs =
    clips.filter((c) => c.status === "queued" || c.status === "cutting").length +
    renders.filter((r) => r.status === "queued" || r.status === "rendering").length;
  const readyClips = clips.filter((c) => c.status === "ready").length;
  const streak = Math.min(30, 1 + Math.floor(stats.clipsCut / 3));

  useEffect(() => {
    startPolling();
    useOpal.getState().bumpStats({});
  }, []);

  /* Android hardware-back closes the pushed screen instead of leaving the app. */
  useEffect(() => {
    if (screen.kind !== "video") return;
    window.history.pushState({ opal: "sheet" }, "");
    const onPop = () => useOpal.getState().popScreen();
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [screen.kind]);

  const badgeFor = (key: TabKey) =>
    key === "queue" ? activeJobs : key === "clips" ? readyClips : 0;

  return (
    <TooltipProvider>
      <div className="relative min-h-dvh w-full overflow-x-hidden">
        <BackgroundFX />

        <div className="relative mx-auto flex min-h-dvh w-full max-w-[1600px]">
          {/* ================= desktop rail ================= */}
          <aside className="sticky top-0 hidden h-dvh w-[264px] shrink-0 flex-col gap-6 border-r border-[var(--hairline)] px-5 py-6 lg:flex">
            <BrandMark />

            <nav className="flex flex-col gap-1.5" aria-label="Main">
              {NAV.map(({ key, label, icon: Icon }) => {
                const active = tab === key;
                const badge = badgeFor(key);
                return (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex h-11 items-center gap-3 rounded-2xl px-3.5 text-[14.5px] font-semibold",
                      "transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      active
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="rail-pill"
                        className="absolute inset-0 rounded-2xl bg-[var(--surface-sunken)]"
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      />
                    )}
                    <Icon
                      className="relative size-[18px]"
                      strokeWidth={active ? 2.1 : 1.8}
                    />
                    <span className="relative">{label}</span>
                    {badge > 0 && (
                      <span className="relative ml-auto rounded-full bg-primary px-2 py-0.5 text-[10.5px] font-bold text-[#04191a]">
                        {badge > 9 ? "9+" : badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="mt-auto flex flex-col gap-3">
              <TunnelCard />
              <InstallPrompt className="w-full" variant="full" />
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] font-medium text-muted-foreground">
                  v2.0 · Opal
                </span>
                <ThemeToggle />
              </div>
            </div>
          </aside>

          {/* ================= main column ================= */}
          <div className="flex min-w-0 flex-1 flex-col">
            {/* mobile top bar */}
            <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-[var(--hairline)] bg-background/70 px-5 py-3 backdrop-blur-xl safe-top lg:hidden">
              <BrandMark compact />
              <div className="flex items-center gap-2">
                <Badge variant="warning" size="sm" className="gap-1">
                  <Flame className="size-3" fill="currentColor" />
                  {streak}
                </Badge>
                <InstallPrompt variant="icon" />
                <ThemeToggle />
              </div>
            </header>

            {/* content */}
            <main className="relative flex-1 px-4 pb-28 pt-4 sm:px-6 lg:px-10 lg:pb-12 lg:pt-8">
              <div className="mx-auto w-full max-w-3xl">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
                  >
                    {!loaded && <BootSkeleton />}
                    {tab === "home" && <HomeScreen />}
                    {tab === "clips" && <ClipsScreen />}
                    {tab === "queue" && <QueueScreen />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </main>

            {/* mobile bottom nav */}
            <nav
              className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--hairline)] bg-background/80 backdrop-blur-xl lg:hidden"
              aria-label="Main"
            >
              <div className="mx-auto flex max-w-lg items-center justify-around px-3 pt-2">
                {NAV.map(({ key, label, icon: Icon }) => {
                  const active = tab === key;
                  const badge = badgeFor(key);
                  return (
                    <motion.button
                      key={key}
                      whileTap={{ scale: 0.92 }}
                      transition={{ type: "spring", stiffness: 500, damping: 28 }}
                      onClick={() => setTab(key)}
                      aria-current={active ? "page" : undefined}
                      className="relative flex min-w-[84px] flex-col items-center gap-1 rounded-2xl px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {active && (
                        <motion.span
                          layoutId="tab-pill"
                          className="absolute inset-0 rounded-2xl bg-[var(--surface-sunken)]"
                          transition={{ type: "spring", stiffness: 420, damping: 32 }}
                        />
                      )}
                      <span className="relative">
                        <Icon
                          size={21}
                          strokeWidth={active ? 2.2 : 1.8}
                          className={active ? "text-foreground" : "text-muted-foreground"}
                        />
                        {badge > 0 && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -right-2 -top-1.5 grid min-w-[16px] place-items-center rounded-full bg-primary px-1 text-[9.5px] font-bold text-[#04191a]"
                          >
                            {badge > 9 ? "9+" : badge}
                          </motion.span>
                        )}
                      </span>
                      <span
                        className={cn(
                          "relative text-[10.5px] font-semibold tracking-wide",
                          active ? "text-foreground" : "text-muted-foreground"
                        )}
                      >
                        {label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
              <div className="safe-bottom" />
            </nav>
          </div>
        </div>

        {/* ================= pushed screen ================= */}
        <AnimatePresence>
          {screen.kind === "video" && (
            <TimestampsScreen key="timestamps" video={screen.video} />
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  );
}

/* ------------------------------------------------------------------ */

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="size-2.5 rounded-[5px] shadow-[0_0_14px_color-mix(in_oklab,var(--brand-teal)_70%,transparent)]"
        style={{
          background:
            "conic-gradient(from 210deg, var(--brand-teal), var(--brand-blue), var(--brand-violet), var(--brand-gold), var(--brand-teal))",
        }}
      />
      <span className="text-[20px] font-bold tracking-[-0.035em] text-foreground">
        Opal
      </span>
      {!compact && (
        <span className="ml-1 rounded-full border border-[var(--hairline)] px-2 py-0.5 text-[10.5px] font-semibold text-muted-foreground">
          Clip Cutter
        </span>
      )}
    </div>
  );
}

function TunnelCard() {
  const tunnel = useOpal((s) => s.tunnel);
  const on = !!tunnel?.warpOn;
  return (
    <div className="surface-glass rounded-2xl p-3.5">
      <div className="flex items-center gap-2">
        <span className="relative flex size-2">
          <span
            className="absolute inline-flex size-full animate-ping rounded-full"
            style={{
              background: on ? "var(--brand-green)" : "var(--brand-rose)",
              animationDuration: "1.8s",
            }}
          />
          <span
            className="relative inline-flex size-2 rounded-full"
            style={{ background: on ? "var(--brand-green)" : "var(--brand-rose)" }}
          />
        </span>
        <span className="text-[12.5px] font-semibold text-foreground">
          {on ? "Tunnel active" : "Tunnel offline"}
        </span>
      </div>
      <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">
        {on
          ? `Egress ${tunnel?.egressIp ?? "via WARP"} — datacenter IP block bypassed.`
          : "Connecting to WARP. Direct links still work."}
      </p>
    </div>
  );
}

function BootSkeleton() {
  return (
    <div className="space-y-4">
      <div className="opal-shimmer h-40 rounded-3xl bg-[var(--surface-sunken)]" />
      <div className="opal-shimmer h-24 rounded-3xl bg-[var(--surface-sunken)]" />
    </div>
  );
}
