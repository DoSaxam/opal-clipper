"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  CircleCheck,
  TriangleAlert,
  Loader2,
  ChevronRight,
  Scissors,
} from "lucide-react";
import { ProgressRing } from "./ProgressRing";
import { GemHero } from "./GemHero";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useOpal } from "@/lib/clipper/store";
import { fmtClock } from "@/lib/clipper/types";

export function QueueScreen() {
  const { clips, videos, renders, setTab } = useOpal();

  const videoOf = (vid: string) => videos.find((v) => v.id === vid);
  const activeRenders = renders.filter(
    (r) => r.status === "queued" || r.status === "rendering"
  );
  const activeClips = clips.filter(
    (c) => c.status === "queued" || c.status === "cutting"
  );
  const doneClips = clips.filter((c) => c.status === "ready");
  const errorClips = clips.filter((c) => c.status === "error");

  return (
    <div className="pb-8">
      <h1 className="text-[27px] font-bold tracking-[-0.03em] text-foreground">
        Timer
      </h1>
      <p className="mt-0.5 text-[13px] text-muted-foreground">
        live cutting sessions — background me chalte rehte hain
      </p>

      {/* renders */}
      {activeRenders.length > 0 && (
        <section className="mt-5">
          <h2 className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Rendering downloads
          </h2>
          <div className="flex flex-col gap-2">
            {activeRenders.slice(0, 4).map((r) => {
              const clip = clips.find((c) => c.id === r.clipId);
              return (
                <motion.div
                  key={r.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="surface-glass flex items-center gap-3 rounded-2xl px-4 py-3"
                >
                  <ProgressRing progress={r.progress} size={38} stroke={3}>
                    <span className="text-[9.5px] font-bold tabular-nums text-foreground">
                      {Math.round(r.progress)}
                    </span>
                  </ProgressRing>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold tabular-nums text-foreground">
                      {clip ? `${fmtClock(clip.start)} → ${fmtClock(clip.end)}` : "clip"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {r.quality === "mp3" ? "MP3 audio" : `${r.quality}p`} · rendering…
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* active cuts */}
      <AnimatePresence mode="popLayout">
        {activeClips.map((c) => {
          const v = videoOf(c.videoId);
          return (
            <motion.div
              key={c.id}
              layout
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
              className="surface-glass mt-4 rounded-3xl p-4"
            >
              <div className="flex items-center gap-3.5">
                <ProgressRing progress={c.progress} size={52}>
                  {c.progress >= 97 ? (
                    <Loader2 className="size-4 animate-spin text-primary" />
                  ) : (
                    <span className="text-[11px] font-bold tabular-nums text-foreground">
                      {Math.round(c.progress)}
                    </span>
                  )}
                </ProgressRing>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-bold tabular-nums text-foreground">
                    {fmtClock(c.start)}
                    <span className="px-1 font-normal text-muted-foreground">→</span>
                    {fmtClock(c.end)}
                  </p>
                  <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                    {v?.title || "…"}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-primary">
                    {c.stage}…
                  </p>
                </div>
              </div>
              <Progress value={c.progress} className="mt-3" />
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* done */}
      {activeClips.length === 0 && doneClips.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="surface-glass mt-5 flex items-center gap-4 rounded-3xl p-5"
          style={{ borderColor: "color-mix(in oklab, var(--brand-green) 30%, transparent)" }}
        >
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 15 }}
            className="grid size-11 shrink-0 place-items-center rounded-full bg-[#68d391]/16"
          >
            <CircleCheck className="size-5 text-[#68d391]" />
          </motion.span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold text-foreground">
              {doneClips.length} clip{doneClips.length > 1 ? "s" : ""} ready
            </p>
            <p className="text-[12px] text-muted-foreground">
              preview &amp; download from My Clips
            </p>
          </div>
          <Button
            onClick={() => setTab("clips")}
            variant="secondary"
            size="sm"
            className="shrink-0 rounded-full"
          >
            View
          </Button>
        </motion.div>
      )}

      {/* errors */}
      {errorClips.length > 0 && (
        <section className="mt-5">
          <h2 className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-destructive">
            Needs attention
          </h2>
          {errorClips.slice(0, 6).map((c) => (
            <motion.div
              key={c.id}
              layout
              className="surface-sunken mb-2 flex items-center gap-3 rounded-2xl px-4 py-3"
              style={{ borderColor: "color-mix(in oklab, var(--brand-rose) 28%, transparent)" }}
            >
              <TriangleAlert className="size-4 shrink-0 text-destructive" />
              <div className="min-w-0">
                <p className="text-[13px] font-semibold tabular-nums text-foreground">
                  {fmtClock(c.start)} → {fmtClock(c.end)}
                </p>
                <p className="truncate text-[11px] text-destructive">{c.error}</p>
              </div>
            </motion.div>
          ))}
        </section>
      )}

      {/* empty */}
      {activeClips.length === 0 &&
        doneClips.length === 0 &&
        errorClips.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center pt-6"
          >
            <GemHero size={130} mini />
            <p className="mt-4 text-[15px] font-semibold text-foreground">
              No active sessions
            </p>
            <p className="mt-1 px-10 text-center text-[12.5px] leading-relaxed text-muted-foreground">
              Jab clips cut ho rahi hongi, live progress yahan dikhega — browser
              band kar do, kaam chalta rahega.
            </p>
            <Button
              onClick={() => setTab("home")}
              variant="secondary"
              className="mt-5 h-11 gap-2 rounded-full px-6 text-[14px]"
            >
              <Scissors className="size-4" />
              Start a session
              <ChevronRight className="size-3.5" />
            </Button>
          </motion.div>
        )}

      {doneClips.length > 0 && (
        <div className="mt-6 flex justify-center">
          <Badge variant="secondary" className="gap-1.5">
            <CircleCheck className="size-3" />
            {doneClips.length} finished · {activeRenders.length} rendering
          </Badge>
        </div>
      )}
    </div>
  );
}
