"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Scissors,
  Sparkles,
  CircleCheck,
  CircleX,
  Clock3,
  BadgeCheck,
  TriangleAlert,
  Plus,
} from "lucide-react";
import { Thumb } from "./Thumb";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useOpal } from "@/lib/clipper/store";
import { parseTimestamps } from "@/lib/clipper/parse";
import { fmtClock, type VideoInfo } from "@/lib/clipper/types";

const STAGES = ["Link", "Timestamps", "Cut", "Download"];

export function TimestampsScreen({ video }: { video: VideoInfo }) {
  const { popScreen, createClips, setTab } = useOpal();
  const [raw, setRaw] = useState("");
  const [cutting, setCutting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ranges = useMemo(() => parseTimestamps(raw, video.duration), [raw, video.duration]);
  const valid = ranges.filter((r) => !r.error);

  const onCut = async () => {
    if (!valid.length || cutting) return;
    setCutting(true);
    setError(null);
    const clips = await createClips(
      video.id,
      valid.map((r) => ({ start: r.start, end: r.end }))
    );
    setCutting(false);
    if (clips) {
      popScreen();
      setTab("queue");
    } else {
      setError("Could not start cutting — check your timestamps and retry.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-stretch justify-center lg:items-center lg:p-6"
    >
      {/* scrim (mobile) */}
      <button
        aria-label="Close"
        onClick={popScreen}
        className="absolute inset-0 bg-black/60 backdrop-blur-[3px] lg:hidden"
      />

      <motion.div
        initial={{ x: "100%", opacity: 0.6 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 36 }}
        className="surface-glass relative flex h-full w-full max-w-2xl flex-col overflow-hidden rounded-none border-0 bg-[var(--surface-strong)] lg:h-[min(860px,calc(100dvh-3rem))] lg:rounded-3xl lg:border"
      >
        {/* nav */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[var(--hairline)] bg-[var(--surface-strong)]/85 px-4 py-3 backdrop-blur-xl safe-top">
          <Button
            variant="ghost"
            size="sm"
            onClick={popScreen}
            className="-ml-2 gap-1 rounded-full px-2.5 text-primary"
          >
            <ChevronLeft className="size-4" />
            Back
          </Button>
          <ol className="flex items-center gap-1.5">
            {STAGES.map((s, i) => (
              <li key={s} className="flex items-center gap-1.5">
                <span
                  className="text-[10.5px] font-bold tracking-wide"
                  style={{
                    color: i <= 1 ? "var(--brand-teal)" : "var(--muted-foreground)",
                  }}
                >
                  {i + 1}·{s}
                </span>
                {i < STAGES.length - 1 && (
                  <span className="h-px w-2 bg-[var(--hairline)]" />
                )}
              </li>
            ))}
          </ol>
        </div>

        {/* body */}
        <div className="opal-scroll flex-1 overflow-y-auto px-5 pb-32">
          {/* video meta */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 150, damping: 20 }}
            className="mt-5 flex gap-3.5"
          >
            <Thumb
              videoId={video.id}
              alt=""
              className="h-[74px] w-[132px] shrink-0 rounded-2xl"
              style={{ border: "1px solid var(--hairline)" }}
            />
            <div className="min-w-0 flex-1 py-0.5">
              <h2 className="line-clamp-2 text-[15.5px] font-bold leading-snug text-foreground">
                {video.title}
              </h2>
              <p className="mt-1 truncate text-[12px] text-muted-foreground">
                {video.uploader || video.extractor}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Badge variant="secondary" size="sm" className="gap-1">
                  <Clock3 className="size-3" />
                  {fmtClock(video.duration)}
                </Badge>
                {video.heights[0] && (
                  <Badge variant="default" size="sm" className="gap-1">
                    <BadgeCheck className="size-3" />
                    {video.heights[0] >= 2160
                      ? "4K "
                      : video.heights[0] >= 1440
                        ? "2K "
                        : ""}
                    {video.heights[0]}p
                  </Badge>
                )}
              </div>
            </div>
          </motion.div>

          {/* timestamps card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 140, damping: 20, delay: 0.05 }}
            className="mt-5"
          >
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[12.5px]">
                  <Sparkles className="size-3.5 text-[#68d391]" />
                  <span className="font-semibold text-foreground">Timestamps</span>
                  <span className="text-muted-foreground">/</span>
                  <span className="text-muted-foreground">Bulk OK</span>
                </div>
                {ranges.length > 0 && (
                  <Badge
                    variant={valid.length ? "default" : "danger"}
                    size="sm"
                    className="tabular-nums"
                  >
                    {valid.length}/{ranges.length} clip{ranges.length > 1 ? "s" : ""}
                  </Badge>
                )}
              </div>

              <h3 className="mt-2.5 text-[19px] font-bold tracking-[-0.02em] text-foreground">
                Yaha se — yaha tak?
              </h3>
              <p className="mt-1 text-[12.5px] leading-snug text-muted-foreground">
                One range per line (or comma-separated). Minutes:seconds,
                h:mm:ss or plain seconds.
              </p>

              <Textarea
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                placeholder={"1:00 - 1:30\n2:15 to 2:45\n300-320"}
                rows={4}
                spellCheck={false}
                aria-label="Timestamps"
                className="mt-3.5 font-mono text-[13.5px]"
                style={{ fontFamily: "var(--font-mono-opal)" }}
              />

              {ranges.length > 0 && (
                <div className="opal-scroll mt-3 flex max-h-56 flex-col gap-1.5 overflow-y-auto pr-1">
                  {ranges.map((r) => (
                    <motion.div
                      key={`${r.index}-${r.raw}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ type: "spring", stiffness: 380, damping: 28 }}
                      className="surface-sunken flex items-center gap-2.5 rounded-xl px-3 py-2"
                      style={
                        r.error
                          ? { borderColor: "color-mix(in oklab, var(--brand-rose) 35%, transparent)" }
                          : undefined
                      }
                    >
                      {r.error ? (
                        <CircleX className="size-4 shrink-0 text-destructive" />
                      ) : (
                        <CircleCheck className="size-4 shrink-0 text-[#68d391]" />
                      )}
                      <span className="w-5 text-[10.5px] font-bold tabular-nums text-muted-foreground">
                        #{r.index + 1}
                      </span>
                      <span className="text-[13px] font-semibold tabular-nums text-foreground">
                        {fmtClock(r.start)}
                        <span className="px-1 text-muted-foreground">→</span>
                        {fmtClock(r.end)}
                      </span>
                      {r.error ? (
                        <span className="ml-auto truncate text-[11px] font-medium text-destructive">
                          {r.error}
                        </span>
                      ) : (
                        <span className="ml-auto text-[11px] font-semibold tabular-nums text-primary">
                          {(r.end - r.start).toFixed(1)}s
                        </span>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}

              {error && (
                <Alert variant="destructive" className="mt-3 flex items-start gap-2">
                  <TriangleAlert className="mt-0.5" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </Card>
          </motion.div>

          <div className="mt-4 flex items-center justify-center gap-2">
            <Plus className="size-3 text-muted-foreground" />
            <p className="text-[11.5px] text-muted-foreground">
              jitne timestamps, utne clips — ek saath cut honge
            </p>
          </div>
        </div>

        {/* sticky CTA */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-5 pb-5 pt-10 safe-bottom">
          <div className="pointer-events-auto bg-gradient-to-t from-[var(--surface-strong)] via-[var(--surface-strong)] to-transparent">
            <Button
              disabled={!valid.length || cutting}
              onClick={onCut}
              className="h-[54px] w-full rounded-2xl text-[16px]"
            >
              {cutting ? (
                <>
                  <Scissors className="size-4 animate-pulse" />
                  Starting…
                </>
              ) : valid.length ? (
                <>
                  <Scissors className="size-4" strokeWidth={2.2} />
                  Cut {valid.length} Clip{valid.length > 1 ? "s" : ""}
                </>
              ) : (
                "Add timestamps to cut"
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
