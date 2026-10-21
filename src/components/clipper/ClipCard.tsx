"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { Loader2 } from "lucide-react";
import { TapButton } from "./TapButton";
import {
  CheckGlyph,
  ChevronDown,
  CircleCheckGlyph,
  CircleXGlyph,
  DownloadGlyph,
  PlayGlyph,
  TrashGlyph,
} from "./icons";
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
    <div ref={cardRef} className="perspective-1100" onPointerMove={onTilt} onPointerLeave={untilt}>
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
          background:
            "radial-gradient(120% 90% at 8% 0%, rgba(28,36,33,1) 0%, rgba(16,18,17,1) 46%, rgba(13,15,14,1) 100%)",
          borderRadius: 28,
          boxShadow: isSelected
            ? "inset 0 0 0 1.5px rgba(183,247,230,0.55), 0 8px 32px rgba(0,0,0,0.5), 0 0 28px -6px rgba(183,247,230,0.25)"
            : "inset 0 0 0 1px rgba(255,255,255,0.055), 0 18px 40px -24px rgba(0,0,0,0.9)",
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
                    className="grid place-items-center"
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: "50%",
                      background: "rgba(11,14,13,0.55)",
                      backdropFilter: "blur(12px)",
                      boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.14)",
                      opacity: playing ? 0 : 1,
                      transition: "opacity .3s",
                    }}
                  >
                    <PlayGlyph style={{ width: 18, height: 20, color: "#ffffff", marginLeft: 2 }} />
                  </div>
                </motion.div>
              </AnimatePresence>
              {/* bottom bar — mint progress */}
              <div
                className="absolute bottom-0 inset-x-0 px-3.5 pb-2.5 pt-8"
                style={{ background: "linear-gradient(to top, rgba(7,10,9,0.85), transparent)" }}
              >
                <div className="flex items-center gap-2">
                  <span className="mono-meta text-[10px]" style={{ color: "#d7dfdb" }}>
                    {fmtClock(curTime)}
                  </span>
                  <div className="flex-1 h-[3.5px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.14)" }}>
                    <div
                      className="opal-progress h-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="mono-meta text-[10px]" style={{ color: "#9db0a8" }}>
                    {fmtClock(dur)}
                  </span>
                </div>
              </div>
            </>
          ) : clip.status === "error" ? (
            <div className="w-full h-full grid place-items-center" style={{ background: "rgba(235,87,87,0.04)" }}>
              <div className="flex flex-col items-center gap-2 px-6 text-center">
                <CircleXGlyph style={{ width: 22, height: 22 }} />
                <p className="text-[11.5px] leading-snug line-clamp-2" style={{ color: "#eb5757" }}>
                  {clip.error}
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full h-full grid place-items-center shimmer" style={{ background: "#0d0f0e" }}>
              <div className="flex flex-col items-center gap-2.5">
                <div
                  className="grid place-items-center"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 14,
                    background: "rgba(183,247,230,0.07)",
                    boxShadow: "inset 0 0 0 1px rgba(183,247,230,0.22)",
                  }}
                >
                  <Loader2 size={16} className="animate-spin" style={{ color: "#CDFCE2" }} />
                </div>
                <span className="mono-meta text-[10.5px]" style={{ color: "#CDFCE2" }}>
                  {clip.stage.toUpperCase()} {clip.progress}%
                </span>
              </div>
            </div>
          )}

          {/* range badge — glass chip */}
          <div className="absolute top-2.5 left-2.5">
            <span
              className="mono-meta text-[10.5px] px-2.5 py-1"
              style={{
                borderRadius: 999,
                color: "#d7dfdb",
                background: "rgba(11,14,13,0.72)",
                backdropFilter: "blur(10px)",
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.12)",
              }}
            >
              {fmtClock(clip.start)} – {fmtClock(clip.end)}
            </span>
          </div>

          {/* select check — mint */}
          <AnimatePresence>
            {selectMode && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute top-2.5 right-2.5 grid place-items-center"
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 9,
                  background: isSelected ? "#CDFCE2" : "rgba(11,14,13,0.6)",
                  boxShadow: isSelected
                    ? "0 0 16px -2px rgba(183,247,230,0.6)"
                    : "inset 0 0 0 1.5px rgba(255,255,255,0.3)",
                  backdropFilter: "blur(6px)",
                }}
              >
                {isSelected && <CheckGlyph style={{ width: 13, height: 12, color: "#0b0e0d" }} />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ===== meta + actions ===== */}
        <div className="px-4 pt-3 pb-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[12.5px] truncate flex-1" style={{ color: "#d7dfdb" }}>
              {video?.title || "Clip"}
            </p>
            <span className="mono-meta text-[10.5px] shrink-0" style={{ color: "#9db0a8" }}>
              {dur.toFixed(1)}s
            </span>
          </div>

          {/* cutting progress */}
          {(clip.status === "cutting" || clip.status === "queued") && (
            <div className="mt-2.5 h-[4px] rounded-full overflow-hidden" style={{ background: "#191e1c" }}>
              <motion.div
                className="opal-progress h-full"
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
                className="btn-ghost h-[34px] px-3.5 flex items-center gap-1.5 text-[12.5px]"
              >
                {activeRender ? (
                  <>
                    <Loader2 size={12} className="animate-spin" style={{ color: "#CDFCE2" }} />
                    <span className="mono-meta" style={{ color: "#CDFCE2" }}>
                      {activeRender.quality === "mp3" ? "MP3" : `${activeRender.quality}P`} {Math.round(activeRender.progress)}%
                    </span>
                  </>
                ) : readyRender ? (
                  <>
                    <CircleCheckGlyph style={{ width: 12, height: 12 }} />
                    <span className="mono-meta" style={{ color: "#d7dfdb" }}>
                      {readyRender.quality === "mp3" ? "MP3" : `${readyRender.quality}P`}
                    </span>
                    <DownloadGlyph style={{ width: 12, height: 12, color: "#8fe3b8" }} />
                  </>
                ) : (
                  <>
                    <DownloadGlyph style={{ width: 12, height: 12, color: "#CDFCE2" }} />
                    Quality
                    <ChevronDown style={{ width: 11, height: 7, color: "#9db0a8" }} />
                  </>
                )}
              </TapButton>

              <div className="flex-1" />

              <TapButton
                onClick={() => onQuality(clip)}
                className="btn-ghost grid place-items-center"
                style={{ width: 34, height: 34 }}
                aria-label="Download"
              >
                <DownloadGlyph style={{ width: 15, height: 15, color: "#CDFCE2" }} />
              </TapButton>

              <TapButton
                onClick={() => {
                  if (confirmDel) void deleteClips([clip.id]);
                  else setConfirmDel(true);
                }}
                onBlur={() => setConfirmDel(false)}
                className="grid place-items-center transition-colors"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 12,
                  boxShadow: confirmDel
                    ? "inset 0 0 0 1px rgba(235,87,87,0.45)"
                    : "inset 0 0 0 1px rgba(255,255,255,0.07)",
                  background: confirmDel ? "rgba(235,87,87,0.08)" : "transparent",
                }}
                aria-label={confirmDel ? "Confirm delete" : "Delete"}
              >
                <TrashGlyph style={{ width: 13, height: 13, color: confirmDel ? "#eb5757" : "#9db0a8" }} />
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
