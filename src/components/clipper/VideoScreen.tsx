"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { TapButton } from "./TapButton";
import {
  ChevronLeft,
  CircleCheckGlyph,
  CircleXGlyph,
  ClockGlyph,
  EllipsisIcon,
  PlayGlyph,
  ScissorsGlyph,
} from "./icons";
import { useOpal } from "@/lib/clipper/store";
import { parseTimestamps } from "@/lib/clipper/parse";
import { fmtClock, type VideoInfo } from "@/lib/clipper/types";

const STAGES = ["LINK", "TIMESTAMPS", "CUT", "DOWNLOAD"];

export function VideoScreen({ video }: { video: VideoInfo }) {
  const { popScreen, createClips, setTab } = useOpal();
  const [raw, setRaw] = useState("");
  const [cutting, setCutting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ranges = useMemo(() => parseTimestamps(raw, video.duration), [raw, video.duration]);
  const valid = ranges.filter((r) => !r.error);

  const examples = "1:00 - 1:30\n2:15 to 2:45\n300-320";

  const onCut = async () => {
    if (!valid.length || cutting) return;
    setCutting(true);
    setError(null);
    const clips = await createClips(video.id, valid.map((r) => ({ start: r.start, end: r.end })));
    setCutting(false);
    if (clips) {
      popScreen();
      setTab("queue");
    } else {
      setError("Could not start cutting — check your timestamps and retry.");
    }
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 320, damping: 34 }}
      className="absolute inset-0 z-30 flex flex-col"
      style={{ background: "linear-gradient(180deg, #0b0e0d 0%, #0b0e0d 52%, #070a09 74%, #010504 100%)" }}
    >
      {/* scrollable content */}
      <div className="flex-1 overflow-y-auto opal-scroll">
        {/* nav + stage tracker */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-4 pt-4 pb-3"
          style={{ background: "linear-gradient(to bottom, #0b0e0d 55%, transparent)" }}
        >
          <TapButton
            onClick={popScreen}
            className="flex items-center gap-1 p-1 -ml-1 text-[13.5px]"
            style={{ color: "#d7dfdb" }}
          >
            <ChevronLeft style={{ width: 17, height: 17 }} />
            Home
          </TapButton>
          <div className="flex items-center gap-1.5">
            {STAGES.map((s, i) => (
              <div key={s} className="flex items-center gap-1.5">
                <span className="mono-meta text-[9.5px]" style={{ color: i <= 1 ? "#CDFCE2" : "#9db0a8" }}>
                  {String(i + 1).padStart(2, "0")} {s}
                </span>
                {i < STAGES.length - 1 && <span className="w-1.5 h-px" style={{ background: "#2b302e" }} />}
              </div>
            ))}
          </div>
        </div>

        {/* video hero — opal card surface */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 140, damping: 20 }}
          className="px-5"
        >
          <div className="opal-card p-3.5 flex gap-3.5" style={{ borderRadius: 28 }}>
            <img
              src={video.thumbnail}
              alt={video.title}
              className="w-[128px] aspect-video object-cover"
              style={{ borderRadius: 14, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.09)" }}
            />
            <div className="flex-1 min-w-0 py-0.5">
              <h2
                className="text-[14.5px] leading-snug line-clamp-2"
                style={{ color: "#ffffff", fontWeight: 510, letterSpacing: "-0.011em" }}
              >
                {video.title}
              </h2>
              <p className="mt-1 text-[12px] truncate" style={{ color: "#9db0a8" }}>
                {video.uploader || video.extractor}
              </p>
              <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                <span
                  className="opal-chip inline-flex items-center gap-1.5 text-[10.5px] px-2.5 py-[4px]"
                  style={{ borderRadius: 999, color: "#d7dfdb" }}
                >
                  <ClockGlyph style={{ width: 11, height: 11 }} />
                  <span className="mono-meta">{fmtClock(video.duration)}</span>
                </span>
                {video.heights[0] && (
                  <span
                    className="inline-flex items-center gap-1 text-[10.5px] px-2.5 py-[4px] mono-meta"
                    style={{
                      borderRadius: 999,
                      color: "#CDFCE2",
                      background: "rgba(183,247,230,0.08)",
                      boxShadow: "inset 0 0 0 1px rgba(183,247,230,0.25)",
                    }}
                  >
                    {video.heights[0] >= 2160 ? "4K " : video.heights[0] >= 1440 ? "2K " : ""}
                    {video.heights[0]}p
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* timestamps card */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 130, damping: 20, delay: 0.06 }}
          className="px-5 mt-4"
        >
          <div className="opal-card p-5" style={{ borderRadius: 28 }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ScissorsGlyph style={{ width: 13, height: 13 }} />
                <span className="mono-meta text-[10.5px]" style={{ color: "#9db0a8" }}>
                  TIMESTAMPS — BULK OK
                </span>
              </div>
              {ranges.length > 0 && (
                <span
                  className="mono-meta text-[11px] px-2.5 py-[3px]"
                  style={{
                    borderRadius: 999,
                    color: valid.length ? "#CDFCE2" : "#eb5757",
                    background: valid.length ? "rgba(183,247,230,0.08)" : "rgba(235,87,87,0.08)",
                  }}
                >
                  {valid.length}/{ranges.length}
                </span>
              )}
            </div>

            <h3 className="mt-3 text-[19px]" style={{ color: "#ffffff", fontWeight: 510, letterSpacing: "-0.02em" }}>
              Yaha se — yaha tak?
            </h3>
            <p className="mt-1 text-[12.5px] leading-relaxed" style={{ color: "#9db0a8" }}>
              One range per line (or comma-separated). Minutes:seconds, h:mm:ss, or plain seconds.
            </p>

            <textarea
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder={examples}
              rows={4}
              spellCheck={false}
              className="opal-input opal-placeholder mt-3.5 w-full px-4 py-3 outline-none resize-none opal-scroll mono-meta text-[13px] leading-relaxed"
              style={{ borderRadius: 16, color: "#ffffff", caretColor: "#CDFCE2" }}
              aria-label="Timestamps"
            />

            {/* parsed rows */}
            {ranges.length > 0 && (
              <div className="mt-3 flex flex-col gap-1.5 max-h-56 overflow-y-auto opal-scroll pr-1">
                {ranges.map((r) => (
                  <motion.div
                    key={`${r.index}-${r.raw}`}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: "spring", stiffness: 380, damping: 28 }}
                    className="opal-chip flex items-center gap-2.5 px-3.5 py-2.5"
                    style={{
                      borderRadius: 16,
                      boxShadow: r.error
                        ? "inset 0 0 0 1px rgba(235,87,87,0.4)"
                        : "inset 0 0 0 1px rgba(255,255,255,0.06)",
                    }}
                  >
                    {r.error ? (
                      <CircleXGlyph style={{ width: 15, height: 15, flex: "none" }} />
                    ) : (
                      <CircleCheckGlyph style={{ width: 15, height: 15, flex: "none" }} />
                    )}
                    <span className="mono-meta text-[10px] w-6" style={{ color: "#9db0a8" }}>
                      {String(r.index + 1).padStart(2, "0")}
                    </span>
                    <span className="mono-meta text-[12.5px]" style={{ color: "#d7dfdb" }}>
                      {fmtClock(r.start)} <span style={{ color: "#9db0a8" }}>→</span> {fmtClock(r.end)}
                    </span>
                    {r.error ? (
                      <span className="ml-auto text-[11px]" style={{ color: "#eb5757" }}>
                        {r.error}
                      </span>
                    ) : (
                      <span className="ml-auto mono-meta text-[11px]" style={{ color: "#CDFCE2" }}>
                        {(r.end - r.start).toFixed(1)}s
                      </span>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {error && (
              <p className="mt-2.5 text-[12.5px]" style={{ color: "#eb5757" }}>
                {error}
              </p>
            )}
          </div>
        </motion.div>

        {/* tip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.12 }}
          className="flex items-center gap-2 justify-center mt-4 px-8"
        >
          <EllipsisIcon style={{ width: 17, height: 4, color: "rgba(157,176,168,0.5)" }} />
          <p className="text-[10.5px]" style={{ color: "#9db0a8" }}>
            jitne timestamps, utne clips — ek saath cut honge
          </p>
        </motion.div>

        {/* spacer for fixed CTA */}
        <div className="h-28" />
      </div>

      {/* fixed CTA */}
      <div
        className="absolute bottom-0 inset-x-0 px-5 pb-6 pt-4"
        style={{
          background: "linear-gradient(to top, #070a09 30%, rgba(7,10,9,0.88) 70%, transparent)",
          backdropFilter: "blur(14px)",
        }}
      >
        <TapButton
          disabled={!valid.length || cutting}
          onClick={onCut}
          className="opal-cta w-full gap-2.5"
          style={{ height: 50, borderRadius: 25, fontSize: 15.5 }}
        >
          {cutting ? (
            <>
              <Loader2 size={16} className="animate-spin" style={{ color: "#CDFCE2" }} />
              <span className="t-button" style={{ fontSize: 15.5 }}>Starting…</span>
            </>
          ) : valid.length ? (
            <>
              <ScissorsGlyph style={{ width: 15, height: 15 }} />
              <span className="t-button" style={{ fontSize: 15.5 }}>
                Cut {valid.length} Clip{valid.length > 1 ? "s" : ""}
              </span>
            </>
          ) : (
            <>
              <span style={{ width: 15, height: 15, opacity: 0 }} />
              <span className="t-button" style={{ fontSize: 15.5 }}>Add timestamps to cut</span>
            </>
          )}
        </TapButton>
      </div>
    </motion.div>
  );
}
