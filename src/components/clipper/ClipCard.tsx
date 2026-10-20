"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Download, Trash2, Loader2, CircleCheck, TriangleAlert, Check, ChevronDown, FileAudio } from "lucide-react";
import { TapButton } from "./TapButton";
import { useOpal } from "@/lib/clipper/store";
import { fmtClock, type Clip, type RenderJob, type VideoInfo } from "@/lib/clipper/types";

export function ClipCard({
  clip,
  video,
  onQuality,
}: {
  clip: Clip;
  video?: VideoInfo;
  onQuality: (clip: Clip) => void;
}) {
  const { renders, selectMode, selected, toggleSelect, deleteClips, stats, bumpStats, downloadedRenderIds, registerAutoDownload } = useOpal();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [curTime, setCurTime] = useState(0);
  const [confirmDel, setConfirmDel] = useState(false);

  // newest render for this clip (any status)
  const myRenders = renders.filter((r) => r.clipId === clip.id).sort((a, b) => b.createdAt - a.createdAt);
  const activeRender: RenderJob | undefined = myRenders.find((r) => r.status === "queued" || r.status === "rendering");
  const readyRender: RenderJob | undefined = [...myRenders].reverse().find((r) => r.status === "ready" && r.quality === myRenders[0]?.quality);

  // auto-download when a single-clip render finishes
  useEffect(() => {
    const r = myRenders[0];
    if (r && r.status === "ready" && !downloadedRenderIds.has(r.id)) {
      registerAutoDownload(r.id);
      bumpStats({ downloads: stats.downloads + 1 });
      const a = document.createElement("a");
      a.href = `/api/render/${r.id}/file`;
      a.download = "";
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  }, [myRenders, downloadedRenderIds, registerAutoDownload, bumpStats, stats.downloads]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      void v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  const isSelected = selected.has(clip.id);
  const dur = clip.end - clip.start;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 240, damping: 26 }}
      className="rounded-[24px] overflow-hidden"
      style={{
        background: "linear-gradient(160deg, rgba(21,26,33,0.95), rgba(21,26,33,0.82))",
        border: `1px solid ${isSelected ? "rgba(129,230,217,0.55)" : "rgba(45,55,72,0.7)"}`,
        boxShadow: isSelected ? "0 0 0 1px rgba(129,230,217,0.35), 0 14px 40px rgba(0,0,0,0.5)" : "0 14px 40px rgba(0,0,0,0.42)",
      }}
    >
      {/* ===== preview area ===== */}
      <div
        className="relative aspect-video cursor-pointer"
        onClick={() => {
          if (selectMode) toggleSelect(clip.id);
          else if (clip.status === "ready") togglePlay();
        }}
      >
        {clip.status === "ready" && clip.hasPreview ? (
          <>
            <video
              ref={videoRef}
              poster={clip.hasPoster ? `/api/clip/${clip.id}/poster` : undefined}
              src={`/api/clip/${clip.id}/preview`}
              playsInline
              preload="metadata"
              className="w-full h-full object-cover"
              onTimeUpdate={(e) => {
                const v = e.currentTarget;
                setProgress(v.duration ? (v.currentTime / v.duration) * 100 : 0);
                setCurTime(v.currentTime);
              }}
              onEnded={() => {
                setPlaying(false);
                setProgress(0);
              }}
            />
            {/* center play/pause */}
            <AnimatePresence>
              <motion.div
                key={playing ? "pause" : "play"}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 grid place-items-center pointer-events-none"
              >
                <div
                  className="w-14 h-14 rounded-full grid place-items-center"
                  style={{
                    background: "rgba(10,11,13,0.55)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(255,255,255,0.16)",
                    opacity: playing ? 0 : 1,
                    transition: "opacity .3s",
                  }}
                >
                  <Play size={22} className="text-white ml-0.5" fill="white" />
                </div>
              </motion.div>
            </AnimatePresence>
            {/* bottom bar */}
            <div className="absolute bottom-0 inset-x-0 px-3.5 pb-2.5 pt-8" style={{ background: "linear-gradient(to top, rgba(5,6,8,0.82), transparent)" }}>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-white/85 tabular-nums">{fmtClock(curTime)}</span>
                <div className="flex-1 h-[3.5px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.16)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${progress}%`,
                      background: "linear-gradient(90deg, #4FD1C5, #63B3ED)",
                      boxShadow: "0 0 8px rgba(129,230,217,0.6)",
                    }}
                  />
                </div>
                <span className="text-[10px] font-semibold text-white/60 tabular-nums">{fmtClock(dur)}</span>
              </div>
            </div>
          </>
        ) : clip.status === "error" ? (
          <div className="w-full h-full grid place-items-center" style={{ background: "rgba(252,129,129,0.05)" }}>
            <div className="flex flex-col items-center gap-2 px-6 text-center">
              <TriangleAlert size={22} className="text-[#FC8181]" />
              <p className="text-[11.5px] text-[#FC8181] leading-snug line-clamp-2">{clip.error}</p>
            </div>
          </div>
        ) : (
          <div className="w-full h-full grid place-items-center opal-shimmer" style={{ background: "#131820" }}>
            <div className="flex flex-col items-center gap-2.5">
              <div
                className="w-11 h-11 rounded-full grid place-items-center"
                style={{ background: "rgba(129,230,217,0.1)", border: "1px solid rgba(129,230,217,0.25)" }}
              >
                <Loader2 size={18} className="animate-spin text-[#81E6D9]" />
              </div>
              <span className="text-[11px] font-semibold text-[#81E6D9]">{clip.stage}… {clip.progress}%</span>
            </div>
          </div>
        )}

        {/* range badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span
            className="text-[10.5px] font-bold text-white px-2.5 py-1 rounded-full tabular-nums"
            style={{
              background: "rgba(10,11,13,0.72)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.14)",
              boxShadow: "0 2px 10px rgba(0,0,0,0.35)",
            }}
          >
            {fmtClock(clip.start)} – {fmtClock(clip.end)}
          </span>
        </div>

        {/* select check */}
        <AnimatePresence>
          {selectMode && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full grid place-items-center"
              style={{
                background: isSelected ? "#81E6D9" : "rgba(10,11,13,0.6)",
                border: isSelected ? "none" : "1.5px solid rgba(255,255,255,0.35)",
                backdropFilter: "blur(6px)",
              }}
            >
              {isSelected && <Check size={15} strokeWidth={3.2} className="text-[#0A0B0D]" />}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ===== meta + actions ===== */}
      <div className="px-4 pt-3 pb-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[12.5px] font-semibold text-[#E2E8F0] truncate flex-1">{video?.title || "Clip"}</p>
          <span className="text-[10.5px] font-bold text-[#718096] tabular-nums shrink-0">{dur.toFixed(1)}s</span>
        </div>

        {/* cutting progress (if still cutting) */}
        {(clip.status === "cutting" || clip.status === "queued") && (
          <div className="mt-2.5 h-[4px] rounded-full overflow-hidden" style={{ background: "#1A202C" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #4FD1C5, #63B3ED)" }}
              animate={{ width: `${clip.progress}%` }}
              transition={{ type: "spring", stiffness: 60, damping: 18 }}
            />
          </div>
        )}

        {clip.status === "ready" && (
          <div className="mt-3 flex items-center gap-2">
            {/* quality pill */}
            <TapButton
              onClick={() => onQuality(clip)}
              className="h-9 px-3 rounded-full flex items-center gap-1.5 text-[12.5px] font-semibold"
              style={{
                background: "linear-gradient(160deg, rgba(38,46,59,0.9), rgba(30,36,46,0.9))",
                color: "#E2E8F0",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 12px rgba(0,0,0,0.3)",
              }}
            >
              {activeRender ? (
                <>
                  <Loader2 size={13} className="animate-spin text-[#81E6D9]" />
                  {activeRender.quality === "mp3" ? "MP3" : `${activeRender.quality}p`} {Math.round(activeRender.progress)}%
                </>
              ) : readyRender ? (
                <>
                  <CircleCheck size={13} className="text-[#68D391]" />
                  {readyRender.quality === "mp3" ? "MP3" : `${readyRender.quality}p`}
                  <Download size={13} className="text-[#68D391]" />
                </>
              ) : (
                <>
                  <Download size={13} className="text-[#81E6D9]" />
                  Quality
                  <ChevronDown size={12} className="text-[#718096]" />
                </>
              )}
            </TapButton>

            <div className="flex-1" />

            <TapButton
              onClick={() => onQuality(clip)}
              className="w-9 h-9 rounded-full grid place-items-center"
              style={{
                background: "linear-gradient(160deg, rgba(129,230,217,0.2), rgba(129,230,217,0.1))",
                border: "1px solid rgba(129,230,217,0.32)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 14px rgba(79,209,197,0.18)",
              }}
              aria-label="Download"
            >
              <Download size={15} className="text-[#81E6D9]" />
            </TapButton>

            <TapButton
              onClick={() => {
                if (confirmDel) void deleteClips([clip.id]);
                else setConfirmDel(true);
              }}
              onBlur={() => setConfirmDel(false)}
              className="w-9 h-9 rounded-full grid place-items-center"
              style={{
                background: confirmDel
                  ? "linear-gradient(160deg, rgba(252,129,129,0.24), rgba(252,129,129,0.12))"
                  : "linear-gradient(160deg, rgba(38,46,59,0.9), rgba(30,36,46,0.9))",
                border: confirmDel ? "1px solid rgba(252,129,129,0.45)" : "1px solid rgba(255,255,255,0.08)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
              }}
              aria-label={confirmDel ? "Confirm delete" : "Delete"}
            >
              <Trash2 size={14} className={confirmDel ? "text-[#FC8181]" : "text-[#718096]"} />
            </TapButton>
          </div>
        )}

        {clip.status === "error" && (
          <div className="mt-2.5 flex items-center gap-2">
            <TapButton
              onClick={() => onQuality(clip)}
              className="h-9 px-4 rounded-full text-[12.5px] font-semibold"
              style={{ background: "#232a36", color: "#E2E8F0", border: "1px solid rgba(45,55,72,0.9)" }}
            >
              Retry via Quality
            </TapButton>
          </div>
        )}
      </div>
    </motion.div>
  );
}
