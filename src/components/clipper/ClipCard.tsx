"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import {
  Play,
  Download,
  Trash2,
  Loader2,
  CircleCheck,
  TriangleAlert,
  Check,
  ChevronDown,
} from "lucide-react";
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

  // ---- premium 3D tilt (fine pointers only) ----
  const cardRef = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 200, damping: 22, mass: 0.6 });
  const sry = useSpring(ry, { stiffness: 200, damping: 22, mass: 0.6 });
  const onTilt = (e: React.PointerEvent) => {
    if (e.pointerType === "touch" || !cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
    const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
    ry.set(nx * 5);
    rx.set(-ny * 5);
  };
  const untilt = () => {
    rx.set(0);
    ry.set(0);
  };

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
    <div ref={cardRef} className="perspective-[1100px]" onPointerMove={onTilt} onPointerLeave={untilt}>
      <motion.div
        layout
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 240, damping: 26 }}
        whileHover={{ y: -3 }}
        style={{
          rotateX: srx,
          rotateY: sry,
          transformStyle: "preserve-3d",
          background: "#0F1011",
          borderRadius: 12,
          boxShadow: isSelected
            ? "rgba(228,242,34,0.5) 0 0 0 1px inset, rgba(0,0,0,0.5) 0 8px 32px"
            : "#23252A 0 0 0 1px inset, rgba(0,0,0,0.35) 0 4px 20px",
        }}
        className="overflow-hidden"
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
              {/* center play — glass disc */}
              <AnimatePresence>
                <motion.div
                  key={playing ? "pause" : "play"}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 grid place-items-center pointer-events-none"
                >
                  <div
                    className="w-[52px] h-[52px] rounded-full grid place-items-center"
                    style={{
                      background: "rgba(8,9,10,0.55)",
                      backdropFilter: "blur(12px)",
                      boxShadow: "rgba(255,255,255,0.14) 0 0 0 1px inset",
                      opacity: playing ? 0 : 1,
                      transition: "opacity .3s",
                    }}
                  >
                    <Play size={20} className="text-paper ml-0.5" fill="white" />
                  </div>
                </motion.div>
              </AnimatePresence>
              {/* bottom bar — acid progress */}
              <div
                className="absolute bottom-0 inset-x-0 px-3.5 pb-2.5 pt-8"
                style={{ background: "linear-gradient(to top, rgba(8,9,10,0.85), transparent)" }}
              >
                <div className="flex items-center gap-2">
                  <span className="mono-meta text-[10px] text-mist">{fmtClock(curTime)}</span>
                  <div className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.14)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${progress}%`, background: "#E4F222" }}
                    />
                  </div>
                  <span className="mono-meta text-[10px] text-ash">{fmtClock(dur)}</span>
                </div>
              </div>
            </>
          ) : clip.status === "error" ? (
            <div className="w-full h-full grid place-items-center" style={{ background: "rgba(235,87,87,0.04)" }}>
              <div className="flex flex-col items-center gap-2 px-6 text-center">
                <TriangleAlert size={20} className="text-coral" />
                <p className="text-[11.5px] text-coral leading-snug line-clamp-2">{clip.error}</p>
              </div>
            </div>
          ) : (
            <div className="w-full h-full grid place-items-center shimmer" style={{ background: "#0D0E10" }}>
              <div className="flex flex-col items-center gap-2.5">
                <div
                  className="w-10 h-10 rounded-[8px] grid place-items-center"
                  style={{ background: "rgba(228,242,34,0.07)", boxShadow: "rgba(228,242,34,0.2) 0 0 0 1px inset" }}
                >
                  <Loader2 size={16} className="animate-spin text-acid" />
                </div>
                <span className="mono-meta text-[10.5px] text-acid">{clip.stage.toUpperCase()} {clip.progress}%</span>
              </div>
            </div>
          )}

          {/* range badge — mono glass */}
          <div className="absolute top-2.5 left-2.5">
            <span
              className="mono-meta text-[10.5px] text-mist px-2.5 py-1 rounded-[4px]"
              style={{
                background: "rgba(8,9,10,0.72)",
                backdropFilter: "blur(10px)",
                boxShadow: "rgba(255,255,255,0.12) 0 0 0 1px inset",
              }}
            >
              {fmtClock(clip.start)} – {fmtClock(clip.end)}
            </span>
          </div>

          {/* select check — acid */}
          <AnimatePresence>
            {selectMode && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute top-2.5 right-2.5 w-[26px] h-[26px] rounded-[6px] grid place-items-center"
                style={{
                  background: isSelected ? "#E4F222" : "rgba(8,9,10,0.6)",
                  boxShadow: isSelected ? "none" : "rgba(255,255,255,0.3) 0 0 0 1.5px inset",
                  backdropFilter: "blur(6px)",
                }}
              >
                {isSelected && <Check size={14} strokeWidth={3.2} className="text-void" />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ===== meta + actions ===== */}
        <div className="px-4 pt-3 pb-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[12.5px] text-mist truncate flex-1">{video?.title || "Clip"}</p>
            <span className="mono-meta text-[10.5px] text-ash shrink-0">{dur.toFixed(1)}s</span>
          </div>

          {/* cutting progress */}
          {(clip.status === "cutting" || clip.status === "queued") && (
            <div className="mt-2.5 h-[3px] rounded-full overflow-hidden" style={{ background: "#161718" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: "#E4F222" }}
                animate={{ width: `${clip.progress}%` }}
                transition={{ type: "spring", stiffness: 60, damping: 18 }}
              />
            </div>
          )}

          {clip.status === "ready" && (
            <div className="mt-3 flex items-center gap-2">
              {/* quality — ghost */}
              <TapButton
                onClick={() => onQuality(clip)}
                className="btn-ghost h-[34px] px-3 flex items-center gap-1.5 text-[12.5px]"
              >
                {activeRender ? (
                  <>
                    <Loader2 size={12} className="animate-spin text-acid" />
                    <span className="mono-meta text-acid">
                      {activeRender.quality === "mp3" ? "MP3" : `${activeRender.quality}P`} {Math.round(activeRender.progress)}%
                    </span>
                  </>
                ) : readyRender ? (
                  <>
                    <CircleCheck size={12} className="text-pulse" />
                    <span className="mono-meta text-mist">
                      {readyRender.quality === "mp3" ? "MP3" : `${readyRender.quality}P`}
                    </span>
                    <Download size={12} className="text-pulse" />
                  </>
                ) : (
                  <>
                    <Download size={12} className="text-acid" />
                    Quality
                    <ChevronDown size={11} className="text-ash" />
                  </>
                )}
              </TapButton>

              <div className="flex-1" />

              <TapButton
                onClick={() => onQuality(clip)}
                className="btn-ghost w-[34px] h-[34px] grid place-items-center"
                aria-label="Download"
              >
                <Download size={14} className="text-acid" />
              </TapButton>

              <TapButton
                onClick={() => {
                  if (confirmDel) void deleteClips([clip.id]);
                  else setConfirmDel(true);
                }}
                onBlur={() => setConfirmDel(false)}
                className="w-[34px] h-[34px] rounded-[6px] grid place-items-center transition-colors"
                style={{
                  boxShadow: confirmDel ? "rgba(235,87,87,0.45) 0 0 0 1px inset" : "#23252A 0 0 0 1px inset",
                  background: confirmDel ? "rgba(235,87,87,0.08)" : "transparent",
                }}
                aria-label={confirmDel ? "Confirm delete" : "Delete"}
              >
                <Trash2 size={13} className={confirmDel ? "text-coral" : "text-ash"} />
              </TapButton>
            </div>
          )}

          {clip.status === "error" && (
            <div className="mt-2.5 flex items-center gap-2">
              <TapButton onClick={() => onQuality(clip)} className="btn-ghost h-[34px] px-4 text-[12.5px]">
                Retry via Quality
              </TapButton>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
