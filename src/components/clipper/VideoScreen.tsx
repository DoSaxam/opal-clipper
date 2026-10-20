"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Scissors,
  Sparkles,
  Plus,
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

const STAGES = ["Link", "Timestamps", "Cut", "Download"];

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
      style={{ background: "#0A0B0D" }}
    >
      {/* scrollable content */}
      <div className="flex-1 overflow-y-auto opal-scroll">
        {/* nav */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 pt-4 pb-3" style={{ background: "linear-gradient(to bottom, #0A0B0D 55%, transparent)" }}>
          <TapButton onClick={popScreen} className="flex items-center gap-1 text-[15px] font-medium text-[#81E6D9] -ml-1 p-1">
            <ChevronLeft size={20} />
            Home
          </TapButton>
          <div className="flex items-center gap-1.5">
            {STAGES.map((s, i) => (
              <div key={s} className="flex items-center gap-1.5">
                <span
                  className="text-[10.5px] font-semibold tracking-wide"
                  style={{ color: i <= 1 ? "#81E6D9" : "#5A6478" }}
                >
                  {i + 1}·{s}
                </span>
                {i < STAGES.length - 1 && <span className="w-2 h-px bg-[#2D3748]" />}
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
          <div className="flex gap-3.5">
            
            <img
              src={video.thumbnail}
              alt={video.title}
              className="w-[132px] aspect-video rounded-xl object-cover"
              style={{ border: "1px solid rgba(45,55,72,0.8)", boxShadow: "0 8px 24px rgba(0,0,0,0.45)" }}
            />
            <div className="flex-1 min-w-0 py-0.5">
              <h2 className="text-[15.5px] font-bold text-white leading-snug line-clamp-2">{video.title}</h2>
              <p className="mt-1 text-[12px] text-[#A0AEC0] truncate">{video.uploader || video.extractor}</p>
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-[#E2E8F0] px-2 py-[3px] rounded-full" style={{ background: "#232a36" }}>
                  <Clock3 size={10} /> {fmtClock(video.duration)}
                </span>
                {video.heights[0] && (
                  <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-[#81E6D9] px-2 py-[3px] rounded-full" style={{ background: "rgba(129,230,217,0.1)", border: "1px solid rgba(129,230,217,0.22)" }}>
                    <BadgeCheck size={10} /> {video.heights[0] >= 2160 ? "4K " : video.heights[0] >= 1440 ? "2K " : ""}{video.heights[0]}p
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
          className="px-5 mt-5"
        >
          <div
            className="rounded-[26px] p-5"
            style={{
              background: "linear-gradient(160deg, rgba(21,26,33,0.92), rgba(21,26,33,0.82))",
              border: "1px solid rgba(45,55,72,0.65)",
              boxShadow: "0 18px 44px rgba(0,0,0,0.5)",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[13px]">
                <Sparkles size={13} className="text-[#68D391]" />
                <span className="font-semibold text-[#E2E8F0]">Timestamps</span>
                <span className="text-[#718096]">/</span>
                <span className="text-[#A0AEC0]">Bulk OK</span>
              </div>
              {ranges.length > 0 && (
                <span
                  className="text-[11px] font-semibold px-2 py-1 rounded-full"
                  style={{
                    color: valid.length ? "#81E6D9" : "#FC8181",
                    background: valid.length ? "rgba(129,230,217,0.1)" : "rgba(252,129,129,0.1)",
                  }}
                >
                  {valid.length}/{ranges.length} clip{ranges.length > 1 ? "s" : ""}
                </span>
              )}
            </div>

            <h3 className="mt-2.5 text-[19px] font-bold text-white tracking-tight">Yaha se — yaha tak?</h3>
            <p className="mt-1 text-[12.5px] text-[#A0AEC0] leading-snug">
              One range per line (or comma-separated). Minutes:seconds or h:mm:ss or plain seconds.
            </p>

            <textarea
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder={examples}
              rows={4}
              spellCheck={false}
              className="mt-3.5 w-full rounded-2xl px-4 py-3 text-[14px] text-white placeholder:text-[#5A6478]/80 bg-[rgba(10,11,13,0.65)] outline-none resize-none opal-scroll"
              style={{ border: "1px solid rgba(45,55,72,0.8)", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: "13.5px" }}
              aria-label="Timestamps"
            />

            {/* parsed chips */}
            {ranges.length > 0 && (
              <div className="mt-3 flex flex-col gap-1.5 max-h-56 overflow-y-auto opal-scroll pr-1">
                {ranges.map((r) => (
                  <motion.div
                    key={`${r.index}-${r.raw}`}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: "spring", stiffness: 380, damping: 28 }}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2"
                    style={{
                      background: r.error ? "rgba(252,129,129,0.07)" : "rgba(10,11,13,0.55)",
                      border: `1px solid ${r.error ? "rgba(252,129,129,0.28)" : "rgba(45,55,72,0.7)"}`,
                    }}
                  >
                    {r.error ? (
                      <CircleX size={15} className="text-[#FC8181] shrink-0" />
                    ) : (
                      <CircleCheck size={15} className="text-[#68D391] shrink-0" />
                    )}
                    <span className="text-[10.5px] font-bold text-[#718096] w-5 tabular-nums">#{r.index + 1}</span>
                    <span className="text-[13px] font-semibold text-[#E2E8F0] tabular-nums">
                      {fmtClock(r.start)} <span className="text-[#5A6478]">→</span> {fmtClock(r.end)}
                    </span>
                    {r.error ? (
                      <span className="ml-auto text-[11px] text-[#FC8181] font-medium">{r.error}</span>
                    ) : (
                      <span className="ml-auto text-[11px] font-semibold text-[#81E6D9] tabular-nums">
                        {(r.end - r.start).toFixed(1)}s
                      </span>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {error && <p className="mt-2.5 text-[12.5px] text-[#FC8181]">{error}</p>}
          </div>
        </motion.div>

        {/* tip row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.12 }}
          className="flex items-center gap-2 justify-center mt-4 px-8"
        >
          <Plus size={12} className="text-[#718096]" />
          <p className="text-[11.5px] text-[#5A6478]">
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
          background: "linear-gradient(to top, #0A0B0D 30%, rgba(10,11,13,0.85) 70%, transparent)",
          backdropFilter: "blur(14px)",
        }}
      >
        <TapButton
          disabled={!valid.length || cutting}
          onClick={onCut}
          className="w-full h-[54px] rounded-full font-semibold text-[16px] flex items-center justify-center gap-2"
          style={{
            background:
              valid.length && !cutting
                ? "linear-gradient(93deg, #4FD1C5 0%, #63B3ED 55%, #B794F4 120%)"
                : "#232a36",
            color: valid.length && !cutting ? "#08110F" : "#5A6478",
            boxShadow: valid.length && !cutting ? "0 12px 34px rgba(79,209,197,0.3)" : "none",
          }}
        >
          {cutting ? (
            "Starting…"
          ) : valid.length ? (
            <>
              <Scissors size={17} strokeWidth={2.2} />
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
