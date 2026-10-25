"use client";

import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useOpal } from "@/lib/clipper/store";
import { fmtClock } from "@/lib/clipper/types";
import { clipColor } from "@/lib/clipper/qualities";
import { Counter } from "./counter";
import { useActiveVideo } from "./use-active-video";
import { ExpiredView } from "./expired";
import { item, stagger } from "./anim";

function stageText(stage: string | undefined, status: string): string {
  if (status === "ready") return "Done";
  if (status === "error") return "Failed";
  if (status === "queued") return stage || "Queued";
  return stage || "Cutting";
}

export function ProgressScreen() {
  const video = useActiveVideo();
  const go = useOpal((s) => s.go);
  const allClips = useOpal((s) => s.clips);
  const activeVideoId = useOpal((s) => s.activeVideoId);

  const clips = useMemo(
    () =>
      allClips
        .filter((c) => c.videoId === activeVideoId)
        .sort((a, b) => a.createdAt - b.createdAt),
    [allClips, activeVideoId]
  );

  const busy = clips.some((c) => c.status === "queued" || c.status === "cutting");
  const anyError = clips.some((c) => c.status === "error");

  // all done (or failed) -> land on the clips screen, like the design
  useEffect(() => {
    if (clips.length && !busy) {
      const t = setTimeout(() => go(3), 700);
      return () => clearTimeout(t);
    }
  }, [busy, clips.length, go]);

  const avg = clips.length
    ? clips.reduce((s, c) => s + (c.status === "ready" ? 100 : Math.floor(c.progress)), 0) / clips.length
    : 0;

  if (!video && !clips.length) return <ExpiredView onHome={() => go(0)} />;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      <motion.div className="meta" variants={item} style={{ marginTop: 22 }}>
        <span>
          Cutting {clips.length} clip{clips.length > 1 ? "s" : ""} in parallel
        </span>
        {anyError ? <span style={{ color: "#e5484d" }}>· some failed</span> : null}
      </motion.div>

      <motion.div className="big" variants={item}>
        <Counter value={Math.floor(avg)} />
        <s>%</s>
      </motion.div>

      <div style={{ height: 18 }} />

      {clips.map((c, i) => {
        const pct = c.status === "ready" ? 100 : Math.floor(c.progress);
        return (
          <motion.div
            key={c.id}
            className="card"
            variants={item}
            style={{ "--c": clipColor(i) } as React.CSSProperties}
          >
            <div className="row">
              <div className="row" style={{ justifyContent: "flex-start" }}>
                <span className="dot" />
                <b>Clip {i + 1}</b>
              </div>
              <span className="meta" style={{ margin: 0 }}>
                {stageText(c.stage, c.status)}
              </span>
            </div>
            <div className="bar">
              <i style={{ width: `${pct}%` }} />
            </div>
            <div className="meta">
              <span>
                {fmtClock(c.start)} to {fmtClock(c.end)}
              </span>
              <span>{pct}%</span>
            </div>
            {c.status === "error" ? <div className="bad">{c.error || "Failed"}</div> : null}
          </motion.div>
        );
      })}
    </motion.div>
  );
}
