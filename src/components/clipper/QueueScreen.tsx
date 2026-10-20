"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CircleCheck, TriangleAlert, Loader2, ChevronRight } from "lucide-react";
import { ProgressRing } from "./ProgressRing";
import { PrismHero } from "./PrismHero";
import { TapButton } from "./TapButton";
import { useOpal } from "@/lib/clipper/store";
import { fmtClock } from "@/lib/clipper/types";

export function QueueScreen() {
  const { clips, videos, renders, setTab } = useOpal();

  const videoOf = (vid: string) => videos.find((v) => v.id === vid);
  const activeRenders = renders.filter((r) => r.status === "queued" || r.status === "rendering");

  const activeClips = clips.filter((c) => c.status === "queued" || c.status === "cutting");
  const doneClips = clips.filter((c) => c.status === "ready");
  const errorClips = clips.filter((c) => c.status === "error");

  return (
    <div className="px-5 pt-2 pb-4">
      <h1 className="text-[26px] text-paper type-heading px-1">Timer</h1>
      <p className="mono-meta text-[10.5px] text-ash mt-1 px-1 mb-4">LIVE CUTTING SESSIONS — BACKGROUND ME CHALTE HAIN</p>

      {/* active renders */}
      {activeRenders.length > 0 && (
        <section className="mb-5">
          <h2 className="type-label mb-2.5 px-1">Rendering downloads</h2>
          <div className="flex flex-col gap-2">
            {activeRenders.slice(0, 4).map((r) => {
              const clip = clips.find((c) => c.id === r.clipId);
              return (
                <motion.div
                  key={r.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 rounded-[8px] px-4 py-3"
                  style={{ background: "rgba(255,255,255,0.02)", boxShadow: "#23252A 0 0 0 1px inset" }}
                >
                  <ProgressRing progress={r.progress} size={36} stroke={3}>
                    <span className="mono-meta text-[9.5px] text-mist">{Math.round(r.progress)}</span>
                  </ProgressRing>
                  <div className="min-w-0 flex-1">
                    <p className="mono-meta text-[12.5px] text-mist">
                      {clip ? `${fmtClock(clip.start)} → ${fmtClock(clip.end)}` : "clip"}
                    </p>
                    <p className="mono-meta text-[10.5px] text-ash mt-0.5">
                      {r.quality === "mp3" ? "MP3 AUDIO" : `${r.quality}P`} · RENDERING…
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
              className="mb-2.5 surface-card p-4"
            >
              <div className="flex items-center gap-3.5">
                <ProgressRing progress={c.progress} size={50}>
                  {c.progress >= 97 ? (
                    <Loader2 size={15} className="animate-spin text-acid" />
                  ) : (
                    <span className="mono-meta text-[11px] text-mist">{Math.round(c.progress)}</span>
                  )}
                </ProgressRing>
                <div className="min-w-0 flex-1">
                  <p className="mono-meta text-[14px] text-paper">
                    {fmtClock(c.start)} <span className="text-ash">→</span> {fmtClock(c.end)}
                  </p>
                  <p className="text-[12px] text-fog truncate mt-0.5">{v?.title || "…"}</p>
                  <p className="mono-meta text-[10.5px] text-acid mt-1">{c.stage.toUpperCase()}…</p>
                </div>
              </div>
              {/* progress bar */}
              <div className="mt-3 h-[3px] rounded-full overflow-hidden" style={{ background: "#161718" }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "#E4F222" }}
                  animate={{ width: `${c.progress}%` }}
                  transition={{ type: "spring", stiffness: 60, damping: 18 }}
                />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* done flash */}
      {activeClips.length === 0 && doneClips.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[12px] p-5 flex items-center gap-4"
          style={{ background: "rgba(39,166,68,0.06)", boxShadow: "rgba(39,166,68,0.3) 0 0 0 1px inset" }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 15 }}
            className="w-10 h-10 rounded-[8px] grid place-items-center"
            style={{ background: "rgba(39,166,68,0.12)" }}
          >
            <CircleCheck size={20} className="text-pulse" />
          </motion.div>
          <div className="flex-1">
            <p className="text-[15px] text-paper" style={{ fontWeight: 510 }}>
              {doneClips.length} clip{doneClips.length > 1 ? "s" : ""} ready
            </p>
            <p className="text-[12px] text-fog mt-0.5">preview & download from My Clips</p>
          </div>
          <TapButton
            onClick={() => setTab("clips")}
            className="h-[34px] px-4 rounded-[6px] text-[12.5px] flex items-center gap-1"
            style={{ background: "rgba(39,166,68,0.1)", color: "#27A644", boxShadow: "rgba(39,166,68,0.35) 0 0 0 1px inset" }}
          >
            View
          </TapButton>
        </motion.div>
      )}

      {/* errors */}
      {errorClips.length > 0 && (
        <section className="mt-4">
          <h2 className="type-label mb-2.5 px-1" style={{ color: "#EB5757" }}>
            Needs attention
          </h2>
          {errorClips.slice(0, 6).map((c) => (
            <motion.div
              key={c.id}
              layout
              className="mb-2 rounded-[8px] px-4 py-3 flex items-center gap-3"
              style={{ background: "rgba(235,87,87,0.04)", boxShadow: "rgba(235,87,87,0.25) 0 0 0 1px inset" }}
            >
              <TriangleAlert size={15} className="text-coral shrink-0" />
              <div className="min-w-0">
                <p className="mono-meta text-[12.5px] text-mist">
                  {fmtClock(c.start)} → {fmtClock(c.end)}
                </p>
                <p className="text-[11px] text-coral truncate mt-0.5">{c.error}</p>
              </div>
            </motion.div>
          ))}
        </section>
      )}

      {/* empty state */}
      {activeClips.length === 0 && doneClips.length === 0 && errorClips.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center pt-6"
        >
          <PrismHero size={92} />
          <p className="text-[15px] text-paper mt-2" style={{ fontWeight: 510 }}>No active sessions</p>
          <p className="text-[12.5px] text-ash mt-1.5 text-center px-10 leading-relaxed">
            Jab clips cut ho rahi hongi, live progress yahan dikhega.
          </p>
          <TapButton
            onClick={() => setTab("home")}
            className="btn-acid acid-sweep mt-5 h-11 px-6 text-[14px] flex items-center gap-2"
          >
            Start a Session <ChevronRight size={14} />
          </TapButton>
        </motion.div>
      )}
    </div>
  );
}
