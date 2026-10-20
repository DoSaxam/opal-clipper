"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Scissors,
  Sparkles,
  Trash2,
  CircleCheck,
  CircleX,
  Clock3,
  BadgeCheck,
} from "lucide-react";
import { TapButton } from "./TapButton";
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
      style={{ background: "#08090A" }}
    >
      {/* scrollable content */}
      <div className="flex-1 overflow-y-auto opal-scroll">
        {/* nav + mono stage tracker */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-4 pt-4 pb-3"
          style={{ background: "linear-gradient(to bottom, #08090A 55%, transparent)" }}
        >
          <TapButton
            onClick={popScreen}
            className="flex items-center gap-1 text-[13.5px] text-mist hover:text-paper transition-colors -ml-1 p-1"
          >
            <ChevronLeft size={17} />
            Home
          </TapButton>
          <div className="flex items-center gap-1.5">
            {STAGES.map((s, i) => (
              <div key={s} className="flex items-center gap-1.5">
                <span className="mono-meta text-[9.5px]" style={{ color: i <= 1 ? "#E4F222" : "#62666D" }}>
                  {String(i + 1).padStart(2, "0")} {s}
                </span>
                {i < STAGES.length - 1 && <span className="w-1.5 h-px bg-graphite" />}
              </div>
            ))}
          </div>
        </div>

        {/* video hero */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 140, damping: 20 }}
          className="px-5"
        >
          <div className="surface-card p-3 flex gap-3.5">
            <img
              src={video.thumbnail}
              alt={video.title}
              className="w-[128px] aspect-video rounded-[6px] object-cover"
              style={{ boxShadow: "#383B3F 0 0 0 1px inset" }}
            />
            <div className="flex-1 min-w-0 py-0.5">
              <h2 className="text-[14.5px] text-paper leading-snug line-clamp-2" style={{ fontWeight: 510, letterSpacing: "-0.011em" }}>
                {video.title}
              </h2>
              <p className="mt-1 text-[12px] text-fog truncate">{video.uploader || video.extractor}</p>
              <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                <span className="inline-flex items-center gap-1 text-[10.5px] text-mist px-2 py-[3px] rounded-[4px]" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <Clock3 size={10} className="text-fog" /> <span className="mono-meta">{fmtClock(video.duration)}</span>
                </span>
                {video.heights[0] && (
                  <span
                    className="inline-flex items-center gap-1 text-[10.5px] px-2 py-[3px] rounded-[4px]"
                    style={{ color: "#E4F222", background: "rgba(228,242,34,0.08)", boxShadow: "rgba(228,242,34,0.22) 0 0 0 1px inset" }}
                  >
                    <BadgeCheck size={10} />
                    <span className="mono-meta">
                      {video.heights[0] >= 2160 ? "4K " : video.heights[0] >= 1440 ? "2K " : ""}{video.heights[0]}p
                    </span>
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
          <div className="surface-card p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={12} className="text-acid" strokeWidth={2} />
                <span className="mono-meta text-[10.5px] text-fog">TIMESTAMPS — BULK OK</span>
              </div>
              {ranges.length > 0 && (
                <span
                  className="mono-meta text-[11px] px-2 py-[3px] rounded-[4px]"
                  style={{
                    color: valid.length ? "#E4F222" : "#EB5757",
                    background: valid.length ? "rgba(228,242,34,0.08)" : "rgba(235,87,87,0.08)",
                  }}
                >
                  {valid.length}/{ranges.length}
                </span>
              )}
            </div>

            <h3 className="mt-3 text-[19px] text-paper type-sub" style={{ fontWeight: 510 }}>
              Yaha se — yaha tak?
            </h3>
            <p className="mt-1 text-[12.5px] text-fog leading-relaxed">
              One range per line (or comma-separated). Minutes:seconds, h:mm:ss, or plain seconds.
            </p>

            <textarea
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder={examples}
              rows={4}
              spellCheck={false}
              className="mt-3.5 w-full rounded-[6px] px-3.5 py-3 text-paper placeholder:text-ash/70 bg-transparent outline-none resize-none opal-scroll mono-meta text-[13px] leading-relaxed"
              style={{ background: "rgba(255,255,255,0.02)", boxShadow: "rgba(255,255,255,0.08) 0 0 0 1px inset" }}
              aria-label="Timestamps"
            />

            {/* parsed rows — mono metadata */}
            {ranges.length > 0 && (
              <div className="mt-3 flex flex-col gap-1.5 max-h-56 overflow-y-auto opal-scroll pr-1">
                {ranges.map((r) => (
                  <motion.div
                    key={`${r.index}-${r.raw}`}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: "spring", stiffness: 380, damping: 28 }}
                    className="flex items-center gap-2.5 rounded-[6px] px-3 py-2"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      boxShadow:
                        r.error
                          ? "rgba(235,87,87,0.35) 0 0 0 1px inset"
                          : "#23252A 0 0 0 1px inset",
                    }}
                  >
                    {r.error ? (
                      <CircleX size={14} className="text-coral shrink-0" />
                    ) : (
                      <CircleCheck size={14} className="text-pulse shrink-0" />
                    )}
                    <span className="mono-meta text-[10px] text-ash w-6">{String(r.index + 1).padStart(2, "0")}</span>
                    <span className="mono-meta text-[12.5px] text-mist">
                      {fmtClock(r.start)} <span className="text-ash">→</span> {fmtClock(r.end)}
                    </span>
                    {r.error ? (
                      <span className="ml-auto text-[11px] text-coral">{r.error}</span>
                    ) : (
                      <span className="ml-auto mono-meta text-[11px] text-acid">
                        {(r.end - r.start).toFixed(1)}s
                      </span>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {error && <p className="mt-2.5 text-[12.5px] text-coral">{error}</p>}
          </div>
        </motion.div>

        {/* tip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.12 }}
          className="flex items-center gap-2 justify-center mt-4 px-8"
        >
          <span className="w-1 h-1 rounded-full bg-graphite" />
          <p className="mono-meta text-[10.5px] text-ash">jitne timestamps, utne clips — ek saath cut honge</p>
        </motion.div>

        {/* spacer for fixed CTA */}
        <div className="h-28" />
      </div>

      {/* fixed CTA */}
      <div
        className="absolute bottom-0 inset-x-0 px-5 pb-6 pt-4"
        style={{
          background: "linear-gradient(to top, #08090A 30%, rgba(8,9,10,0.88) 70%, transparent)",
          backdropFilter: "blur(14px)",
        }}
      >
        <TapButton
          disabled={!valid.length || cutting}
          onClick={onCut}
          className="btn-acid acid-sweep w-full h-[50px] text-[15px] flex items-center justify-center gap-2"
        >
          {cutting ? (
            "Starting…"
          ) : valid.length ? (
            <>
              <Scissors size={16} strokeWidth={2.2} />
              Cut {valid.length} Clip{valid.length > 1 ? "s" : ""}
            </>
          ) : (
            <>
              <Trash2 size={15} className="opacity-0" />
              Add timestamps to cut
            </>
          )}
        </TapButton>
      </div>
    </motion.div>
  );
}
