"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Play,
  Pause,
  Download,
  Trash2,
  Loader2,
  CircleCheck,
  TriangleAlert,
  Check,
  ChevronDown,
  FileAudio,
  MoreHorizontal,
  RefreshCw,
  Gauge,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useOpal } from "@/lib/clipper/store";
import { fmtClock, type Clip, type VideoInfo } from "@/lib/clipper/types";
import { cn } from "@/lib/utils";

export function ClipCard({
  clip,
  video,
  onQuality,
}: {
  clip: Clip;
  video?: VideoInfo;
  onQuality: (clip: Clip) => void;
}) {
  const {
    renders,
    selectMode,
    selected,
    toggleSelect,
    deleteClips,
    bumpStats,
  } = useOpal();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [curTime, setCurTime] = useState(0);
  const [confirmDel, setConfirmDel] = useState(false);

  const myRenders = renders
    .filter((r) => r.clipId === clip.id)
    .sort((a, b) => b.createdAt - a.createdAt);
  const activeRender = myRenders.find(
    (r) => r.status === "queued" || r.status === "rendering"
  );
  const readyRender = myRenders.find((r) => r.status === "ready");

  /* a finished render surfaces as a toast with a one-tap download */
  const announced = useRef<string | null>(null);
  useEffect(() => {
    if (!readyRender) return;
    if (announced.current === readyRender.id) return;
    announced.current = readyRender.id;
    toast.success("Render ready", {
      description: `${readyRender.quality === "mp3" ? "MP3" : `${readyRender.quality}p`} · ${video?.title ?? "clip"}`,
      action: {
        label: "Download",
        onClick: () => {
          const a = document.createElement("a");
          a.href = `/api/render/${readyRender.id}/file`;
          a.download = "";
          document.body.appendChild(a);
          a.click();
          a.remove();
          bumpStats({ downloads: useOpal.getState().stats.downloads + 1 });
        },
      },
      duration: 8000,
    });
  }, [readyRender, video?.title, bumpStats]);

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

  const download = () => {
    if (!readyRender) return;
    const a = document.createElement("a");
    a.href = `/api/render/${readyRender.id}/file`;
    a.download = "";
    document.body.appendChild(a);
    a.click();
    a.remove();
    bumpStats({ downloads: useOpal.getState().stats.downloads + 1 });
    toast.success("Download started");
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 240, damping: 26 }}
      className={cn(
        "surface-glass overflow-hidden rounded-3xl transition-shadow",
        isSelected && "ring-2 ring-primary/60"
      )}
    >
      {/* preview */}
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
              className="size-full object-cover"
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
            <AnimatePresence>
              <motion.div
                key={playing ? "pause" : "play"}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="pointer-events-none absolute inset-0 grid place-items-center"
              >
                <div
                  className="grid size-14 place-items-center rounded-full border border-white/15 bg-black/45 backdrop-blur-md transition-opacity duration-300"
                  style={{ opacity: playing ? 0 : 1 }}
                >
                  <Play className="ml-0.5 size-5 text-white" fill="white" />
                </div>
              </motion.div>
            </AnimatePresence>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3.5 pb-2.5 pt-8">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold tabular-nums text-white/85">
                  {fmtClock(curTime)}
                </span>
                <div className="h-[3.5px] flex-1 overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full bg-brand-gradient"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-[10px] font-semibold tabular-nums text-white/60">
                  {fmtClock(dur)}
                </span>
              </div>
            </div>
          </>
        ) : clip.status === "error" ? (
          <div className="grid size-full place-items-center bg-destructive/5">
            <div className="flex flex-col items-center gap-2 px-6 text-center">
              <TriangleAlert className="size-5 text-destructive" />
              <p className="line-clamp-2 text-[11.5px] leading-snug text-destructive">
                {clip.error}
              </p>
            </div>
          </div>
        ) : (
          <div className="opal-shimmer grid size-full place-items-center bg-[var(--surface-sunken)]">
            <div className="flex flex-col items-center gap-2.5">
              <div className="grid size-11 place-items-center rounded-full bg-primary/10">
                <Loader2 className="size-4 animate-spin text-primary" />
              </div>
              <span className="text-[11px] font-semibold text-primary">
                {clip.stage}… {clip.progress}%
              </span>
            </div>
          </div>
        )}

        {/* range badge */}
        <div className="absolute left-3 top-3">
          <Badge
            variant="glass"
            size="sm"
            className="tabular-nums backdrop-blur-md"
          >
            {fmtClock(clip.start)} – {fmtClock(clip.end)}
          </Badge>
        </div>

        {/* select */}
        <AnimatePresence>
          {selectMode && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute right-2.5 top-2.5"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSelect(clip.id);
                }}
                aria-label="Select clip"
                className={cn(
                  "grid size-7 place-items-center rounded-full border transition-colors",
                  isSelected
                    ? "border-primary bg-primary text-[#04191a]"
                    : "border-white/40 bg-black/50 backdrop-blur-md"
                )}
              >
                {isSelected && <Check className="size-3.5" strokeWidth={3.5} />}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* meta + actions */}
      <div className="px-4 pb-4 pt-3">
        <div className="flex items-center justify-between gap-2">
          <p className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-foreground">
            {video?.title || "Clip"}
          </p>
          <span className="shrink-0 text-[10.5px] font-bold tabular-nums text-muted-foreground">
            {dur.toFixed(1)}s
          </span>
        </div>

        {(clip.status === "cutting" || clip.status === "queued") && (
          <Progress value={clip.progress} className="mt-2.5" />
        )}

        {clip.status === "ready" && (
          <div className="mt-3 flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onQuality(clip)}
              className="h-9 gap-1.5 rounded-full px-3 text-[12.5px]"
            >
              {activeRender ? (
                <>
                  <Loader2 className="size-3.5 animate-spin text-primary" />
                  {activeRender.quality === "mp3" ? "MP3" : `${activeRender.quality}p`}{" "}
                  {Math.round(activeRender.progress)}%
                </>
              ) : readyRender ? (
                <>
                  <CircleCheck className="size-3.5 text-[#68d391]" />
                  {readyRender.quality === "mp3" ? "MP3" : `${readyRender.quality}p`}
                </>
              ) : (
                <>
                  <Gauge className="size-3.5 text-primary" />
                  Quality
                  <ChevronDown className="size-3 text-muted-foreground" />
                </>
              )}
            </Button>

            <div className="flex-1" />

            <Button
              size="icon-sm"
              variant={readyRender ? "default" : "secondary"}
              onClick={readyRender ? download : () => onQuality(clip)}
              aria-label="Download"
              className="rounded-full"
            >
              {readyRender ? (
                <Download className="size-3.5" />
              ) : (
                <FileAudio className="size-3.5" />
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon-sm"
                  variant="secondary"
                  aria-label="More actions"
                  className="rounded-full"
                >
                  <MoreHorizontal className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => onQuality(clip)}>
                  <Gauge className="size-4" />
                  Render another quality
                </DropdownMenuItem>
                {readyRender && (
                  <DropdownMenuItem onSelect={download}>
                    <Download className="size-4" />
                    Download file
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onSelect={() => {
                    if (confirmDel) {
                      void deleteClips([clip.id]);
                    } else {
                      setConfirmDel(true);
                      toast("Tap delete again to confirm", {
                        action: {
                          label: "Delete now",
                          onClick: () => void deleteClips([clip.id]),
                        },
                      });
                    }
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="size-4" />
                  {confirmDel ? "Confirm delete" : "Delete clip"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {clip.status === "error" && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onQuality(clip)}
            className="mt-2.5 h-9 gap-1.5 rounded-full text-[12.5px]"
          >
            <RefreshCw className="size-3.5" />
            Retry
          </Button>
        )}
      </div>
    </motion.div>
  );
}
