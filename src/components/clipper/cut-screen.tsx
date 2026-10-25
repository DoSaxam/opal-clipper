"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Scissors, WandSparkles } from "lucide-react";
import { useOpal } from "@/lib/clipper/store";
import { parseTimestamps } from "@/lib/clipper/parse";
import { fmtClock } from "@/lib/clipper/types";
import { bestLabel, clipColor } from "@/lib/clipper/qualities";
import { toast } from "./toast";
import { useActiveVideo } from "./use-active-video";
import { ExpiredView } from "./expired";
import { dockIn, item, stagger } from "./anim";

export function CutScreen() {
  const video = useActiveVideo();
  const ts = useOpal((s) => s.tsDraft);
  const setTs = useOpal((s) => s.setTsDraft);
  const createClips = useOpal((s) => s.createClips);
  const go = useOpal((s) => s.go);
  const [submitting, setSubmitting] = useState(false);

  const parsed = useMemo(() => parseTimestamps(ts, video?.duration || 0), [ts, video?.duration]);
  const valid = useMemo(() => parsed.filter((p) => !p.error), [parsed]);
  const bad = useMemo(() => parsed.filter((p) => p.error), [parsed]);
  const totalSec = valid.reduce((s, p) => s + (p.end - p.start), 0);

  /** Duration-aware samples that showcase every accepted format. */
  const fillSample = () => {
    const d = video?.duration || 300;
    const seg = (f: number, len: number) => {
      const a = Math.round(d * f);
      const b = Math.min(d, a + Math.min(len, Math.max(1, d - a)));
      return [a, b] as const;
    };
    const [a1, b1] = seg(0.08, 18);
    const [a2, b2] = seg(0.3, 24);
    const [a3, b3] = seg(0.55, 30);
    setTs(
      [
        `${fmtClock(a1)} - ${fmtClock(b1)}`,
        `${fmtClock(a2)} to ${fmtClock(b2)}`,
        `${a3}-${b3}`,
      ].join("\n")
    );
  };

  const submit = async () => {
    if (!video || !valid.length || submitting) return;
    setSubmitting(true);
    const res = await createClips(
      video.id,
      valid.map((v) => ({ start: v.start, end: v.end }))
    );
    setSubmitting(false);
    if (!res) toast("Could not start cutting");
    // on success the store advances to step 2 (progress)
  };

  if (!video) return <ExpiredView onHome={() => go(0)} />;

  const n = valid.length;
  const dur = video.duration || 1;

  return (
    <>
      <motion.div variants={stagger} initial="hidden" animate="show">
        <motion.h1 variants={item}>Pick your clips</motion.h1>

        <motion.div className="card vid" variants={item} style={{ marginTop: 18 }}>
          <div className="th">
            {video.thumbnail ? <img src={video.thumbnail} alt="" /> : null}
            <small>{fmtClock(video.duration)}</small>
          </div>
          <div style={{ minWidth: 0 }}>
            <b>{video.title}</b>
            <span>
              {video.uploader || video.extractor} · up to {bestLabel(video)}
            </span>
          </div>
        </motion.div>

        <motion.div className="card" variants={item}>
          <div className="tl">
            {valid.map((p, i) => (
              <i
                key={i}
                style={{
                  left: `${(p.start / dur) * 100}%`,
                  width: `${Math.max(1.2, ((p.end - p.start) / dur) * 100)}%`,
                  background: clipColor(i),
                }}
              />
            ))}
          </div>
          <div className="meta">
            <span>0:00</span>
            <span>{fmtClock(video.duration)}</span>
          </div>
        </motion.div>

        <motion.div className="card" variants={item}>
          <div className="row" style={{ marginBottom: 8 }}>
            <span className="meta one" style={{ margin: 0 }}>
              Timestamps, one per line
            </span>
            <button className="link" onClick={fillSample}>
              <WandSparkles className="lucide sm" /> Sample
            </button>
          </div>
          <textarea
            value={ts}
            onChange={(e) => setTs(e.target.value)}
            placeholder={"1:00 - 1:30\n2:15 to 2:23\n300-320"}
            spellCheck={false}
          />
        </motion.div>

        <motion.div className="row" variants={item} style={{ padding: "0 6px" }}>
          <span className="ok">
            {n ? `${n} clip${n > 1 ? "s" : ""} · ${fmtClock(totalSec)} total` : ""}
          </span>
        </motion.div>
        {bad.length ? (
          <motion.div className="bad" variants={item} style={{ padding: "0 6px" }}>
            Can&apos;t read {bad.length} line{bad.length > 1 ? "s" : ""}:{" "}
            {bad
              .slice(0, 2)
              .map((b) => `“${b.raw}”`)
              .join(", ")}
            {bad.length > 2 ? " …" : ""}
          </motion.div>
        ) : null}
      </motion.div>

      <div className="dock">
        <motion.button
          className="btn"
          variants={dockIn}
          initial="hidden"
          animate="show"
          disabled={!n || submitting}
          onClick={() => void submit()}
        >
          <Scissors className="lucide" />
          {submitting ? "Starting…" : n ? `Cut ${n} clip${n > 1 ? "s" : ""}` : "Cut clips"}
        </motion.button>
      </div>
    </>
  );
}
