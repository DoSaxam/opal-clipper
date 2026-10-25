"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, Download, Loader2, Music, Play } from "lucide-react";
import { useOpal } from "@/lib/clipper/store";
import { fmtBytes, fmtClock, type Clip } from "@/lib/clipper/types";
import { tierLabel } from "@/lib/clipper/qualities";
import { toast } from "./toast";
import { item } from "./anim";

/**
 * One ready clip: embedded REAL preview player (range-streamed from the server),
 * accurate SRC timestamps mapped to the original video timeline, REAL file sizes
 * from disk (never estimates), original-audio badge, and a manual-only download
 * button that renders the selected quality on demand.
 */
export function ClipCard({ clip, index, color }: { clip: Clip; index: number; color: string }) {
  const q = useOpal((s) => s.quality);
  const allRenders = useOpal((s) => s.renders);
  const render = allRenders.find((r) => r.clipId === clip.id && r.quality === q);
  const selectMode = useOpal((s) => s.selectMode);
  const selected = useOpal((s) => s.selected.has(clip.id));
  const toggleSelect = useOpal((s) => s.toggleSelect);
  const startRender = useOpal((s) => s.startRender);
  const downloadRender = useOpal((s) => s.downloadRender);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(clip.end - clip.start);

  const durSec = clip.end - clip.start;
  const busyRender = !!render && (render.status === "queued" || render.status === "rendering");
  const readyRender = !!render && render.status === "ready";

  const play = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) void v.play();
    else v.pause();
  };

  const onDownload = () => {
    if (readyRender && render) {
      downloadRender(render.id);
      toast(`Downloading ${tierLabel(q)} · ${fmtBytes(render.sizeBytes)}`);
      return;
    }
    if (busyRender) {
      toast(`Rendering ${tierLabel(q)} — ${Math.floor(render?.progress || 0)}%`);
      return;
    }
    // no render for this quality yet -> start one (manual action, no auto-download)
    void startRender([clip.id], q).then((r) => {
      if (r) toast(`Rendering ${tierLabel(q)}…`);
      else toast("Could not start render");
    });
  };

  return (
    <motion.div
      className={selected ? "card sel" : "card"}
      variants={item}
      style={{ "--c": color } as React.CSSProperties}
      onClick={selectMode ? () => toggleSelect(clip.id) : undefined}
    >
      <div className={selectMode ? "pl dim" : "pl"}>
        {selectMode ? (
          <button
            className={selected ? "selbox on" : "selbox"}
            aria-label="Select clip"
            onClick={(e) => {
              e.stopPropagation();
              toggleSelect(clip.id);
            }}
          >
            {selected ? <Check className="lucide" /> : null}
          </button>
        ) : null}

        {clip.hasPreview ? (
          <>
            <video
              ref={videoRef}
              src={`/api/clip/${clip.id}/preview`}
              poster={clip.hasPoster ? `/api/clip/${clip.id}/poster` : undefined}
              preload="metadata"
              playsInline
              onLoadedMetadata={(e) => setDur(e.currentTarget.duration || durSec)}
              onTimeUpdate={(e) => setCur(e.currentTarget.currentTime)}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={() => {
                setPlaying(false);
                setCur(0);
              }}
              onClick={selectMode ? undefined : play}
            />
            {!playing && !selectMode ? (
              <button className="play" onClick={play} aria-label="Play">
                <Play className="lucide" />
              </button>
            ) : null}
            <div className="scrub">
              <span>{fmtClock(cur)}</span>
              <div
                onClick={(e) => {
                  const v = videoRef.current;
                  if (!v) return;
                  const box = e.currentTarget.getBoundingClientRect();
                  const f = (e.clientX - box.left) / box.width;
                  const t = Math.max(0, Math.min(1, f)) * (v.duration || durSec);
                  v.currentTime = t;
                  setCur(t);
                }}
              >
                <i style={{ width: `${dur ? Math.min(100, (cur / dur) * 100) : 0}%` }} />
              </div>
              <span>SRC {fmtClock(clip.start + cur)}</span>
            </div>
            <div className="pchips">
              <span className="pchip">
                <Music className="lucide" /> ORIGINAL AUDIO
              </span>
              <span className="pchip">PREVIEW {fmtBytes(clip.previewBytes)}</span>
            </div>
          </>
        ) : (
          <div className="plexp">Preview expired — the server is temporary</div>
        )}
      </div>

      <div className="row" style={{ marginTop: 14 }}>
        <div style={{ minWidth: 0 }}>
          <b>Clip {index + 1}</b>
          <div className="meta one" style={{ margin: "2px 0 0" }}>
            <span>
              {fmtClock(clip.start)} to {fmtClock(clip.end)}
            </span>
          </div>
          {readyRender && render ? (
            <div className="meta one" style={{ margin: "2px 0 0" }}>
              <span className="qstat ready">
                {tierLabel(q).toUpperCase()} · {fmtBytes(render.sizeBytes)} READY
              </span>
            </div>
          ) : null}
          {render?.status === "error" ? (
            <div className="bad">{render.error || "Render failed"}</div>
          ) : null}
          {busyRender && render ? (
            <>
              <div className="bar">
                <i style={{ width: `${Math.floor(render.progress)}%` }} />
              </div>
              <div className="meta">
                <span>
                  Rendering {tierLabel(q)} · original audio…
                </span>
                <span>{Math.floor(render.progress)}%</span>
              </div>
            </>
          ) : null}
        </div>
        {!selectMode ? (
          <button
            className="ib"
            aria-label="Download clip"
            disabled={busyRender}
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
          >
            {busyRender ? (
              <Loader2 className="lucide spin" />
            ) : (
              <Download className="lucide" style={readyRender ? { color: "var(--acc)" } : undefined} />
            )}
          </button>
        ) : null}
      </div>
    </motion.div>
  );
}
