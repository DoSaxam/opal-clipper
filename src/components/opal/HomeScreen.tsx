"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ClipboardPaste,
  Flame,
  Link2,
  Loader2,
  Scissors,
  ArrowDownToLine,
  Clock3,
  ShieldCheck,
  ChevronRight,
  X,
  TriangleAlert,
  History,
} from "lucide-react";
import { GemHero } from "./GemHero";
import { Thumb } from "./Thumb";
import { AnimatedNumber } from "./AnimatedNumber";
import { InstallPrompt } from "./InstallPrompt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useOpal } from "@/lib/clipper/store";
import { fmtClock, fmtDur } from "@/lib/clipper/types";
import { cn } from "@/lib/utils";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};
const rise = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 130, damping: 20 },
  },
};

export function HomeScreen() {
  const {
    analyze,
    analyzing,
    analyzeError,
    tunnel,
    stats,
    clips,
    renders,
    videos,
    pushScreen,
  } = useOpal();
  const [url, setUrl] = useState("");
  const [clipboardOk, setClipboardOk] = useState(false);

  useEffect(() => {
    navigator.clipboard
      ?.readText()
      .then((t) => setClipboardOk(/^https?:\/\//i.test((t || "").trim())))
      .catch(() => setClipboardOk(false));
  }, []);

  const pasteFromClipboard = async () => {
    try {
      const t = await navigator.clipboard.readText();
      if (t) setUrl(t.trim());
    } catch {
      /* permission denied */
    }
  };

  const readyClips = clips.filter((c) => c.status === "ready").length;
  const working =
    clips.some((c) => c.status === "queued" || c.status === "cutting") ||
    renders.some((r) => r.status === "queued" || r.status === "rendering");

  const totalScore = stats.clipsCut + readyClips;
  const streak = Math.min(30, 1 + Math.floor(stats.clipsCut / 3));

  const statusLine = useMemo(() => {
    if (working) {
      const n = clips.filter((c) => c.status === "cutting" || c.status === "queued").length;
      return `${n} clip${n === 1 ? "" : "s"} cutting…`;
    }
    if (readyClips > 0)
      return `${readyClips} clip${readyClips === 1 ? "" : "s"} ready to download`;
    return "Paste any video link to begin";
  }, [working, clips, readyClips]);

  const canAnalyze = /^https?:\/\//i.test(url.trim()) && !analyzing;

  const recent = useMemo(
    () => [...videos].sort((a, b) => b.createdAt - a.createdAt).slice(0, 4),
    [videos]
  );

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      {/* ============ hero ============ */}
      <motion.section variants={rise} className="flex flex-col items-center">
        <div className="-mt-8 scale-[0.86] sm:scale-100 sm:-mt-10">
          <GemHero size={200} />
        </div>

        <span className="text-[11.5px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          Score
        </span>
        <div className="flex items-start gap-2">
          <AnimatedNumber
            value={totalScore}
            className="display-num text-brand-gradient text-[64px] leading-[1.02] sm:text-[76px]"
          />
          {totalScore > 0 && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 16, delay: 0.2 }}
              className="mt-4 grid size-6 place-items-center rounded-full bg-[#68d391]/14 text-[#68d391]"
            >
              <svg width="11" height="11" viewBox="0 0 10 10" fill="none">
                <path
                  d="M5 8.5V1.5M5 1.5L1.8 4.7M5 1.5l3.2 3.2"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.span>
          )}
        </div>
        <span className="mt-1 text-[12.5px] font-medium text-muted-foreground">
          clips cut all-time
        </span>

        {/* stat trio */}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {[
            {
              icon: Scissors,
              label: "Clips",
              value: stats.clipsCut + readyClips,
              tone: "var(--brand-teal)",
            },
            {
              icon: ArrowDownToLine,
              label: "Downloads",
              value: stats.downloads,
              tone: "var(--brand-blue)",
            },
            {
              icon: Clock3,
              label: "Saved",
              value: Math.round(stats.savedSeconds / 60),
              suffix: "m",
              tone: "var(--brand-green)",
            },
          ].map(({ icon: Icon, label, value, tone, suffix }) => (
            <div
              key={label}
              className="surface-sunken flex items-center gap-2 rounded-full px-3.5 py-2"
            >
              <Icon size={15} strokeWidth={1.9} style={{ color: tone }} />
              <span className="text-[15px] font-semibold tabular-nums text-foreground">
                {value}
                {suffix ?? ""}
              </span>
              <span className="text-[11.5px] font-medium text-muted-foreground">
                {label}
              </span>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ============ new session ============ */}
      <motion.section variants={rise} className="mt-8">
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[12.5px]">
              <Link2 size={13} className="text-[#68d391]" strokeWidth={2.2} />
              <span className="font-semibold text-foreground">New Session</span>
              <span className="text-muted-foreground">/</span>
              <span className="text-muted-foreground">Paste Link</span>
            </div>
            <ChevronRight size={16} className="text-muted-foreground" />
          </div>

          <h1 className="mt-2.5 text-[22px] font-bold tracking-[-0.025em] text-foreground sm:text-[25px]">
            What are we cutting today?
          </h1>
          <p className="mt-1 text-[13.5px] leading-snug text-muted-foreground">
            YouTube or any yt-dlp supported link — cut frame-accurate clips with
            bulk timestamps.
          </p>

          <div className="mt-4 flex items-center gap-2">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canAnalyze) void analyze(url.trim());
              }}
              placeholder="https://youtube.com/watch?v=…"
              spellCheck={false}
              autoCapitalize="none"
              autoCorrect="off"
              inputMode="url"
              aria-label="Video link"
              className="h-[50px] flex-1"
            />
            {url ? (
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setUrl("")}
                aria-label="Clear link"
                className="shrink-0 rounded-2xl"
              >
                <X className="size-4" />
              </Button>
            ) : (
              clipboardOk && (
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={pasteFromClipboard}
                  aria-label="Paste from clipboard"
                  className="shrink-0 rounded-2xl text-primary"
                >
                  <ClipboardPaste className="size-4" />
                </Button>
              )
            )}
          </div>

          {analyzeError && (
            <Alert variant="destructive" className="mt-3 flex items-start gap-2">
              <TriangleAlert className="mt-0.5" />
              <AlertDescription>{analyzeError}</AlertDescription>
            </Alert>
          )}

          <Button
            disabled={!canAnalyze}
            onClick={() => void analyze(url.trim())}
            className="mt-4 h-[52px] w-full rounded-2xl text-[15.5px]"
          >
            {analyzing ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Analyzing through the tunnel…
              </>
            ) : (
              <>
                <Scissors className="size-4" strokeWidth={2.2} />
                Analyze Link
              </>
            )}
          </Button>
        </Card>
      </motion.section>

      {/* ============ tunnel pill ============ */}
      <motion.section variants={rise} className="mt-4 flex justify-center">
        <div className="surface-glass flex items-center gap-2 rounded-full px-4 py-2">
          <span className="relative flex size-2">
            <span
              className="absolute inline-flex size-full animate-ping rounded-full"
              style={{
                background: tunnel?.warpOn ? "var(--brand-green)" : "var(--brand-rose)",
                animationDuration: "1.7s",
              }}
            />
            <span
              className="relative inline-flex size-2 rounded-full"
              style={{
                background: tunnel?.warpOn ? "var(--brand-green)" : "var(--brand-rose)",
              }}
            />
          </span>
          <ShieldCheck
            className={cn("size-3.5")}
            style={{
              color: tunnel?.warpOn ? "var(--brand-green)" : "var(--brand-rose)",
            }}
          />
          <span className="text-[12.5px] font-semibold text-foreground">
            {tunnel?.warpOn ? "Tunnel active" : "Tunnel reconnecting…"}
          </span>
          {tunnel?.warpOn && tunnel.egressIp && (
            <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
              {tunnel.egressIp}
            </span>
          )}
        </div>
      </motion.section>

      {/* ============ install ============ */}
      <motion.section variants={rise} className="mt-5">
        <InstallPrompt variant="card" />
      </motion.section>

      {/* ============ recent sessions ============ */}
      {recent.length > 0 && (
        <motion.section variants={rise} className="mt-7">
          <div className="mb-2.5 flex items-center gap-2">
            <History className="size-3.5 text-muted-foreground" />
            <h2 className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Recent sessions
            </h2>
          </div>
          <div className="space-y-2">
            {recent.map((v) => {
              const count = clips.filter((c) => c.videoId === v.id).length;
              return (
                <button
                  key={v.id}
                  onClick={() => pushScreen({ kind: "video", video: v })}
                  className="surface-glass flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Thumb
                    videoId={v.id}
                    alt=""
                    className="h-12 w-[84px] shrink-0 rounded-xl"
                    style={{ border: "1px solid var(--hairline)" }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-semibold text-foreground">
                      {v.title}
                    </p>
                    <p className="mt-0.5 flex items-center gap-2 text-[11.5px] text-muted-foreground">
                      <span className="tabular-nums">{fmtClock(v.duration)}</span>
                      {count > 0 && (
                        <Badge variant="secondary" size="sm">
                          {count} clip{count === 1 ? "" : "s"}
                        </Badge>
                      )}
                    </p>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </button>
              );
            })}
          </div>
        </motion.section>
      )}

      <motion.p
        variants={rise}
        className="mt-6 text-center text-[12px] font-medium text-muted-foreground"
      >
        {statusLine}
        {stats.savedSeconds > 0 && (
          <span className="mt-0.5 block text-[11px] opacity-70">
            {fmtDur(stats.savedSeconds)} of footage trimmed so far
          </span>
        )}
      </motion.p>
    </motion.div>
  );
}
