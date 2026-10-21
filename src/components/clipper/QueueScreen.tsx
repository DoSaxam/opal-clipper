"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { ProgressRing } from "./ProgressRing";
import { TapButton } from "./TapButton";
import {
  AlertGlyph,
  ChevronRight,
  CircleCheckGlyph,
  HourglassIcon,
  ScissorsGlyph,
} from "./icons";
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
      <div className="flex items-center gap-3 px-1">
        <HourglassIcon style={{ width: 15, height: 22 }} />
        <h1 className="text-[26px] text-white" style={{ fontWeight: 510, letterSpacing: "-0.022em" }}>
          Timer
        </h1>
      </div>
      <p className="mono-meta text-[10.5px] mt-1 px-1 mb-4" style={{ color: "#9db0a8" }}>
        LIVE CUTTING SESSIONS — BACKGROUND ME CHALTE HAIN
      </p>

      {/* active renders */}
      {activeRenders.length > 0 && (
        <section className="mb-5">
          <h2 className="mb-2.5 px-1 mono-meta text-[10.5px]" style={{ color: "#9db0a8" }}>
            RENDERING DOWNLOADS
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
                  className="opal-chip flex items-center gap-3.5 px-4 py-3.5"
                  style={{ borderRadius: 20 }}
                >
                  <ProgressRing progress={r.progress} size={36} stroke={3}>
                    <span className="mono-meta text-[9.5px]" style={{ color: "#d7dfdb" }}>
                      {Math.round(r.progress)}
                    </span>
                  </ProgressRing>
                  <div className="min-w-0 flex-1">
                    <p className="mono-meta text-[12.5px]" style={{ color: "#d7dfdb" }}>
                      {clip ? `${fmtClock(clip.start)} → ${fmtClock(clip.end)}` : "clip"}
                    </p>
                    <p className="mono-meta text-[10.5px] mt-0.5" style={{ color: "#9db0a8" }}>
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
              className="mb-2.5 opal-card p-4"
              style={{ borderRadius: 28 }}
            >
              <div className="flex items-center gap-3.5">
                <ProgressRing progress={c.progress} size={50}>
                  {c.progress >= 97 ? (
                    <Loader2 size={15} className="animate-spin" style={{ color: "#CDFCE2" }} />
                  ) : (
                    <span className="mono-meta text-[11px]" style={{ color: "#d7dfdb" }}>
                      {Math.round(c.progress)}
                    </span>
                  )}
                </ProgressRing>
                <div className="min-w-0 flex-1">
                  <p className="mono-meta text-[14px]" style={{ color: "#ffffff" }}>
                    {fmtClock(c.start)} <span style={{ color: "#9db0a8" }}>→</span> {fmtClock(c.end)}
                  </p>
                  <p className="text-[12px] truncate mt-0.5" style={{ color: "#9db0a8" }}>
                    {v?.title || "…"}
                  </p>
                  <p className="mono-meta text-[10.5px] mt-1" style={{ color: "#CDFCE2" }}>
                    {c.stage.toUpperCase()}…
                  </p>
                </div>
              </div>
              {/* progress bar */}
              <div className="mt-3.5 h-[4px] rounded-full overflow-hidden" style={{ background: "#191e1c" }}>
                <motion.div
                  className="opal-progress h-full"
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
          className="flex items-center gap-4 px-5 py-5"
          style={{
            borderRadius: 28,
            background: "rgba(143,227,184,0.06)",
            boxShadow: "inset 0 0 0 1px rgba(143,227,184,0.3)",
          }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 15 }}
            className="grid place-items-center"
            style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              background: "rgba(143,227,184,0.12)",
              boxShadow: "inset 0 0 0 1px rgba(143,227,184,0.35)",
            }}
          >
            <CircleCheckGlyph style={{ width: 22, height: 22 }} />
          </motion.div>
          <div className="flex-1">
            <p className="text-[15px]" style={{ color: "#ffffff", fontWeight: 510 }}>
              {doneClips.length} clip{doneClips.length > 1 ? "s" : ""} ready
            </p>
            <p className="text-[12px] mt-0.5" style={{ color: "#b0c2ba" }}>
              preview & download from My Clips
            </p>
          </div>
          <TapButton
            onClick={() => setTab("clips")}
            className="px-4 text-[12.5px] flex items-center gap-1"
            style={{
              height: 34,
              borderRadius: 17,
              background: "rgba(143,227,184,0.1)",
              color: "#8fe3b8",
              boxShadow: "inset 0 0 0 1px rgba(143,227,184,0.35)",
            }}
          >
            View
            <ChevronRight style={{ width: 6.6, height: 12 }} />
          </TapButton>
        </motion.div>
      )}

      {/* errors */}
      {errorClips.length > 0 && (
        <section className="mt-4">
          <h2 className="mb-2.5 px-1 mono-meta text-[10.5px]" style={{ color: "#eb5757" }}>
            NEEDS ATTENTION
          </h2>
          {errorClips.slice(0, 6).map((c) => (
            <motion.div
              key={c.id}
              layout
              className="mb-2 flex items-center gap-3 px-4 py-3"
              style={{
                borderRadius: 18,
                background: "rgba(235,87,87,0.05)",
                boxShadow: "inset 0 0 0 1px rgba(235,87,87,0.28)",
              }}
            >
              <AlertGlyph style={{ width: 16, height: 15, color: "#eb5757", flex: "none" }} />
              <div className="min-w-0">
                <p className="mono-meta text-[12.5px]" style={{ color: "#d7dfdb" }}>
                  {fmtClock(c.start)} → {fmtClock(c.end)}
                </p>
                <p className="text-[11px] truncate mt-0.5" style={{ color: "#eb5757" }}>
                  {c.error}
                </p>
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
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            style={{ color: "#CDFCE2", filter: "drop-shadow(0 0 18px rgba(183,247,230,0.4))" }}
          >
            <ScissorsGlyph style={{ width: 54, height: 54 }} />
          </motion.div>
          <p className="text-[15px] mt-3" style={{ color: "#ffffff", fontWeight: 510 }}>
            No active sessions
          </p>
          <p className="text-[12.5px] mt-1.5 text-center px-10 leading-relaxed" style={{ color: "#9db0a8" }}>
            Jab clips cut ho rahi hongi, live progress yahan dikhega.
          </p>
          <TapButton
            onClick={() => setTab("home")}
            className="opal-cta mt-5 px-6 gap-2"
            style={{ height: 44, borderRadius: 22, fontSize: 14 }}
          >
            <span className="t-button" style={{ fontSize: 14 }}>Start a Session</span>
            <ChevronRight style={{ width: 6.6, height: 12, color: "#dfeeeb" }} />
          </TapButton>
        </motion.div>
      )}
    </div>
  );
}
