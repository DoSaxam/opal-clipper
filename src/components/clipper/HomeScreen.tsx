"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ClipboardPaste,
  Link2,
  Loader2,
  Scissors,
  ArrowDownToLine,
  Clock3,
  ShieldCheck,
  ChevronRight,
  X,
  TriangleAlert,
} from "lucide-react";
import { PrismHero } from "./PrismHero";
import { AnimatedNumber } from "./AnimatedNumber";
import { TapButton } from "./TapButton";
import { useOpal } from "@/lib/clipper/store";
import { fmtDur } from "@/lib/clipper/types";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const rise = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 120, damping: 20 } },
};

export function HomeScreen() {
  const { analyze, analyzing, analyzeError, tunnel, stats, clips, renders } = useOpal();
  const [url, setUrl] = useState("");
  const [clipboardOk, setClipboardOk] = useState(false);

  useEffect(() => {
    navigator.clipboard
      ?.readText()
      .then((t) => setClipboardOk(/^https?:\/\//i.test((t || "").trim())))
      .catch(() => setClipboardOk(false));
  }, []);

  const pasteFromClipboard = async () => {
    try {
      const t = await navigator.clipboard.readText();
      if (t) setUrl(t.trim());
    } catch {
      /* denied */
    }
  };

  const readyClips = clips.filter((c) => c.status === "ready").length;
  const working =
    clips.some((c) => c.status === "queued" || c.status === "cutting") ||
    renders.some((r) => r.status === "queued" || r.status === "rendering");

  const totalScore = stats.clipsCut + readyClips;

  const statusLine = useMemo(() => {
    if (working) return `${clips.filter((c) => c.status === "cutting" || c.status === "queued").length} clips cutting…`;
    if (readyClips > 0) return `${readyClips} clip${readyClips > 1 ? "s" : ""} ready to download`;
    return "Paste any video link to begin";
  }, [working, clips, readyClips]);

  const canAnalyze = /^https?:\/\//i.test(url.trim()) && !analyzing;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col">
      {/* ===== Top bar ===== */}
      <motion.header variants={rise} className="flex items-center justify-between px-6 pt-4">
        <div className="flex items-center gap-2.5">
          {/* acid glyph mark — precision square */}
          <span
            className="w-[18px] h-[18px] rounded-[4px]"
            style={{
              background: "linear-gradient(135deg, #eefba0 0%, #E4F222 55%, #a9bd16 100%)",
              boxShadow: "rgba(228,242,34,0.35) 0 0 14px",
            }}
          />
          <span className="text-[17px] text-paper" style={{ fontWeight: 510, letterSpacing: "-0.022em" }}>
            Opal
          </span>
          <span className="mono-meta text-[10px] text-ash mt-0.5">CLIPPER</span>
        </div>
        <div className="flex items-center gap-2">
          {/* streak — ghost pill */}
          <div
            className="flex items-center gap-1.5 h-8 px-3 rounded-full"
            style={{ background: "rgba(255,255,255,0.04)", boxShadow: "#23252A 0 0 0 1px inset" }}
            title="Daily streak"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-acid" />
            <span className="text-[13px] text-mist tnum" style={{ fontWeight: 510 }}>
              {Math.min(30, 1 + Math.floor(stats.clipsCut / 3))}
            </span>
          </div>
          {/* avatar — geometric, monochrome */}
          <div
            className="w-8 h-8 rounded-full grid place-items-center text-[12px] text-mist"
            style={{ background: "#161718", boxShadow: "#383B3F 0 0 0 1px inset" }}
            aria-label="Profile"
          >
            O
          </div>
        </div>
      </motion.header>

      {/* ===== 3D prism ===== */}
      <motion.div variants={rise} className="flex justify-center -my-1">
        <PrismHero size={124} />
      </motion.div>

      {/* ===== Score ===== */}
      <motion.div variants={rise} className="flex flex-col items-center -mt-2">
        <span className="type-label">Score</span>
        <div className="flex items-start gap-2">
          <AnimatedNumber
            value={totalScore}
            className="type-display text-[64px] text-paper tnum"
          />
          {totalScore > 0 && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 16, delay: 0.25 }}
              className="mt-3 w-[22px] h-[22px] rounded-[4px] grid place-items-center"
              style={{ background: "rgba(39,166,68,0.12)", boxShadow: "rgba(39,166,68,0.35) 0 0 0 1px inset" }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M5 8.5V1.5M5 1.5L1.8 4.7M5 1.5l3.2 3.2" stroke="#27A644" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.span>
          )}
        </div>
        <span className="text-[12.5px] text-fog mt-1.5">clips cut all-time</span>
      </motion.div>

      {/* ===== Stats trio — quiet pills ===== */}
      <motion.div variants={rise} className="flex justify-center gap-2 mt-6 px-6">
        {[
          { icon: Scissors, label: "Clips", value: stats.clipsCut + readyClips },
          { icon: ArrowDownToLine, label: "Downloads", value: stats.downloads },
          { icon: Clock3, label: "Saved", value: `${Math.round(stats.savedSeconds / 60)}m` },
        ].map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="flex items-center gap-2 rounded-[6px] px-3 py-2"
            style={{ background: "rgba(255,255,255,0.03)", boxShadow: "#23252A 0 0 0 1px inset" }}
          >
            <Icon size={14} strokeWidth={1.8} className="text-fog" />
            <span className="text-[14px] text-bone tnum" style={{ fontWeight: 510 }}>
              {value}
            </span>
            <span className="text-[11px] text-ash">{label}</span>
          </div>
        ))}
      </motion.div>

      {/* ===== URL card ===== */}
      <motion.div variants={rise} className="px-5 mt-7">
        <div className="surface-card p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-[2px] bg-acid" />
              <span className="mono-meta text-[10.5px] text-fog">NEW SESSION — PASTE LINK</span>
            </div>
            <ChevronRight size={14} className="text-ash" />
          </div>

          <h2 className="mt-3 text-[21px] text-paper type-sub" style={{ fontWeight: 510 }}>
            What are we cutting today?
          </h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-fog">
            YouTube or any video link — cut precise clips with bulk timestamps.
          </p>

          {/* input */}
          <div
            className="mt-4 flex items-center gap-2 rounded-[6px] px-3.5 min-h-[46px] transition-all"
            style={{
              background: "rgba(255,255,255,0.02)",
              boxShadow: "rgba(255,255,255,0.08) 0 0 0 1px inset",
            }}
          >
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canAnalyze) void analyze(url.trim());
              }}
              placeholder="https://youtube.com/watch?v=…"
              spellCheck={false}
              autoCapitalize="none"
              className="flex-1 bg-transparent outline-none text-[14px] text-paper placeholder:text-ash py-3"
              style={{ letterSpacing: "-0.011em" }}
              aria-label="Video link"
            />
            {url ? (
              <TapButton
                onClick={() => setUrl("")}
                className="p-1.5 rounded-[4px] text-ash hover:text-mist transition-colors"
                aria-label="Clear"
              >
                <X size={15} />
              </TapButton>
            ) : (
              clipboardOk && (
                <TapButton
                  onClick={pasteFromClipboard}
                  className="p-1.5 rounded-[4px] text-acid"
                  aria-label="Paste from clipboard"
                >
                  <ClipboardPaste size={16} />
                </TapButton>
              )
            )}
          </div>

          {analyzeError && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2.5 flex items-start gap-2 text-[12.5px] text-coral"
            >
              <TriangleAlert size={14} className="mt-0.5 shrink-0" />
              <span>{analyzeError}</span>
            </motion.div>
          )}

          {/* the single chromatic action */}
          <TapButton
            disabled={!canAnalyze}
            onClick={() => void analyze(url.trim())}
            className="btn-acid acid-sweep mt-4 w-full h-[48px] text-[14.5px] flex items-center justify-center gap-2"
          >
            {analyzing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Analyzing through the tunnel…
              </>
            ) : (
              <>
                <Scissors size={15} strokeWidth={2.2} />
                Analyze Link
              </>
            )}
          </TapButton>
        </div>
      </motion.div>

      {/* ===== tunnel status — quiet badge ===== */}
      <motion.div variants={rise} className="flex justify-center mt-4">
        <div
          className="flex items-center gap-2 rounded-[6px] px-3.5 py-2"
          style={{ background: "rgba(255,255,255,0.03)", boxShadow: "#23252A 0 0 0 1px inset" }}
        >
          <span className="relative flex w-[7px] h-[7px]">
            <span
              className="absolute inline-flex w-full h-full rounded-full animate-ping"
              style={{ background: tunnel?.warpOn ? "#27A644" : "#EB5757", animationDuration: "1.8s" }}
            />
            <span
              className="relative inline-flex w-[7px] h-[7px] rounded-full"
              style={{ background: tunnel?.warpOn ? "#27A644" : "#EB5757" }}
            />
          </span>
          <ShieldCheck size={12} className={tunnel?.warpOn ? "text-pulse" : "text-coral"} />
          <span className="text-[12px] text-mist" style={{ fontWeight: 510 }}>
            {tunnel?.warpOn ? "Tunnel Active" : "Tunnel Reconnecting…"}
          </span>
          {tunnel?.warpOn && tunnel.egressIp && (
            <span className="mono-meta text-[10.5px] text-ash">{tunnel.egressIp}</span>
          )}
        </div>
      </motion.div>

      <motion.p variants={rise} className="text-center text-[12px] text-ash mt-3 mb-2">
        {statusLine}
      </motion.p>
    </motion.div>
  );
}
