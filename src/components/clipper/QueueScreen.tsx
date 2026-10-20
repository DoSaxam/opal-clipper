"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CircleCheck, TriangleAlert, Loader2, ChevronRight } from "lucide-react";
import { ProgressRing } from "./ProgressRing";
import { GemHero } from "./GemHero";
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
      <h1 className="text-[28px] font-bold text-white tracking-tight px-1" style={{ letterSpacing: "-0.03em" }}>
        Timer
      </h1>
      <p className="text-[13px] text-[#A0AEC0] mt-0.5 px-1 mb-4">live cutting sessions — background me chalte rehte hain</p>

      {/* active renders */}
      {activeRenders.length > 0 && (
        <section className="mb-5">
          <h2 className="text-[11px] font-bold tracking-[0.14em] uppercase text-[#718096] mb-2.5 px-1">Rendering downloads</h2>
          <div className="flex flex-col gap-2">
            {activeRenders.slice(0, 4).map((r) => {
              const clip = clips.find((c) => c.id === r.clipId);
              return (
                <motion.div
                  key={r.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3"
                  style={{ background: "rgba(21,26,33,0.85)", border: "1px solid rgba(45,55,72,0.7)" }}
                >
                  <ProgressRing progress={r.progress} size={38} stroke={3}>
                    <span className="text-[9.5px] font-bold text-[#E2E8F0] tabular-nums">{Math.round(r.progress)}</span>
                  </ProgressRing>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-[#E2E8F0] truncate">
                      {clip ? `${fmtClock(clip.start)} → ${fmtClock(clip.end)}` : "clip"}
                    </p>
                    <p className="text-[11px] text-[#718096]">{r.quality === "mp3" ? "MP3 audio" : `${r.quality}p`} · rendering…</p>
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
              className="mb-2.5 rounded-[22px] p-4"
              style={{
                background: "linear-gradient(150deg, rgba(21,26,33,0.95), rgba(21,26,33,0.8))",
                border: "1px solid rgba(45,55,72,0.75)",
                boxShadow: "0 14px 36px rgba(0,0,0,0.42)",
              }}
            >
              <div className="flex items-center gap-3.5">
                <ProgressRing progress={c.progress} size={52}>
                  {c.progress >= 97 ? (
                    <Loader2 size={16} className="animate-spin text-[#81E6D9]" />
                  ) : (
                    <span className="text-[11px] font-bold text-[#E2E8F0] tabular-nums">{Math.round(c.progress)}</span>
                  )}
                </ProgressRing>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-bold text-white tabular-nums">
                    {fmtClock(c.start)} <span className="text-[#5A6478] font-normal">→</span> {fmtClock(c.end)}
                  </p>
                  <p className="text-[12px] text-[#A0AEC0] truncate mt-0.5">{v?.title || "…"}</p>
                  <p className="text-[11px] text-[#81E6D9] font-semibold mt-1">{c.stage}…</p>
                </div>
              </div>
              {/* progress bar */}
              <div className="mt-3 h-[5px] rounded-full overflow-hidden" style={{ background: "#1A202C" }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #4FD1C5, #63B3ED, #B794F4)" }}
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
          className="rounded-[22px] p-5 flex items-center gap-4"
          style={{
            background: "linear-gradient(150deg, rgba(104,211,145,0.12), rgba(21,26,33,0.9))",
            border: "1px solid rgba(104,211,145,0.3)",
          }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 15 }}
            className="w-11 h-11 rounded-full grid place-items-center"
            style={{ background: "rgba(104,211,145,0.16)" }}
          >
            <CircleCheck size={22} className="text-[#68D391]" />
          </motion.div>
          <div className="flex-1">
            <p className="text-[15px] font-bold text-white">{doneClips.length} clip{doneClips.length > 1 ? "s" : ""} ready</p>
            <p className="text-[12px] text-[#A0AEC0]">preview & download from My Clips</p>
          </div>
          <TapButton
            onClick={() => setTab("clips")}
            className="h-9 px-4 rounded-full text-[13px] font-semibold"
            style={{ background: "rgba(104,211,145,0.16)", color: "#68D391", border: "1px solid rgba(104,211,145,0.35)" }}
          >
            View
          </TapButton>
        </motion.div>
      )}

      {/* errors */}
      {errorClips.length > 0 && (
        <section className="mt-4">
          <h2 className="text-[11px] font-bold tracking-[0.14em] uppercase text-[#FC8181] mb-2.5 px-1">Needs attention</h2>
          {errorClips.slice(0, 6).map((c) => (
            <motion.div
              key={c.id}
              layout
              className="mb-2 rounded-2xl px-4 py-3 flex items-center gap-3"
              style={{ background: "rgba(252,129,129,0.06)", border: "1px solid rgba(252,129,129,0.2)" }}
            >
              <TriangleAlert size={16} className="text-[#FC8181] shrink-0" />
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-[#E2E8F0] tabular-nums">
                  {fmtClock(c.start)} → {fmtClock(c.end)}
                </p>
                <p className="text-[11px] text-[#FC8181] truncate">{c.error}</p>
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
          <GemHero size={130} mini />
          <p className="text-[15px] font-semibold text-[#E2E8F0] mt-4">No active sessions</p>
          <p className="text-[12.5px] text-[#718096] mt-1 text-center px-10 leading-relaxed">
            Jab clips cut ho rahi hongi, live progress yahan dikhega — bilkul Opal ke focus session jaisa.
          </p>
          <TapButton
            onClick={() => setTab("home")}
            className="mt-5 h-11 px-6 rounded-full text-[14px] font-semibold flex items-center gap-2"
            style={{ background: "rgba(129,230,217,0.12)", color: "#81E6D9", border: "1px solid rgba(129,230,217,0.3)" }}
          >
            Start a Session <ChevronRight size={15} />
          </TapButton>
        </motion.div>
      )}
    </div>
  );
}
