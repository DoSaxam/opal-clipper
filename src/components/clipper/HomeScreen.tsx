"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ClipboardPaste, Flame, Link2, Loader2, Scissors, ArrowDownToLine, Clock3, ShieldCheck, ChevronRight, X, TriangleAlert } from "lucide-react";
import { GemHero } from "./GemHero";
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
    // show paste affordance only when a clipboard value exists
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
  const streak = Math.min(30, 1 + Math.floor(stats.clipsCut / 3));

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
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-[4px]"
            style={{
              background: "conic-gradient(from 210deg, #4FD1C5, #63B3ED, #B794F4, #F6E05E, #4FD1C5)",
              boxShadow: "0 0 12px rgba(129,230,217,0.6)",
            }}
          />
          <span className="text-[26px] font-bold tracking-tight text-white" style={{ letterSpacing: "-0.03em" }}>
            Opal
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 h-9 px-3 rounded-full" style={{ background: "rgba(246,224,94,0.08)", border: "1px solid rgba(246,224,94,0.16)" }}>
            <Flame size={14} className="text-[#F6E05E]" fill="#F6E05E" strokeWidth={1.5} />
            <span className="text-[15px] font-semibold text-[#F6E05E] tabular-nums">{streak}</span>
          </div>
          <div
            className="w-9 h-9 rounded-full grid place-items-center text-[13px] font-bold text-white/90"
            style={{
              background: "conic-gradient(from 40deg, #4FD1C5, #553C9A, #63B3ED, #4FD1C5)",
              border: "1px solid rgba(255,255,255,0.14)",
              boxShadow: "0 4px 14px rgba(0,0,0,0.4)",
            }}
            aria-label="Profile"
          >
            O
          </div>
        </div>
      </motion.header>

      {/* ===== Gem ===== */}
      <motion.div variants={rise} className="flex justify-center -my-2">
        <GemHero size={188} />
      </motion.div>

      {/* ===== Score ===== */}
      <motion.div variants={rise} className="flex flex-col items-center -mt-3">
        <span className="text-[14px] font-medium tracking-[0.12em] uppercase text-[#A0AEC0]">Score</span>
        <div className="flex items-start gap-2">
          <AnimatedNumber
            value={totalScore}
            className="opal-display text-[68px] leading-[1.02] text-transparent bg-clip-text"
            style={{
              backgroundImage: "linear-gradient(180deg, #F7FAFC 22%, #81E6D9 88%)",
            }}
          />
          {totalScore > 0 && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 16, delay: 0.25 }}
              className="mt-4 w-6 h-6 rounded-full grid place-items-center"
              style={{ background: "rgba(104,211,145,0.14)", border: "1px solid rgba(104,211,145,0.3)" }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M5 8.5V1.5M5 1.5L1.8 4.7M5 1.5l3.2 3.2" stroke="#68D391" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.span>
          )}
        </div>
        <span className="text-[12.5px] text-[#718096] font-medium mt-1">clips cut all-time</span>
      </motion.div>

      {/* ===== Stats trio ===== */}
      <motion.div variants={rise} className="flex justify-center gap-2.5 mt-6 px-6">
        {[
          { icon: Scissors, label: "Clips", value: stats.clipsCut + readyClips, color: "#81E6D9", dim: true },
          { icon: ArrowDownToLine, label: "Downloads", value: stats.downloads, color: "#63B3ED", dim: false },
          { icon: Clock3, label: "Saved", value: Math.round(stats.savedSeconds / 60), color: "#68D391", dim: false, suffix: "m" },
        ].map(({ icon: Icon, label, value, color, dim, suffix }) => (
          <div
            key={label}
            className="flex items-center gap-2 rounded-full px-3.5 py-2"
            style={{
              border: `1px solid ${dim ? "rgba(129,230,217,0.32)" : "rgba(45,55,72,0.6)"}`,
              background: "rgba(10,11,13,0.45)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
            }}
          >
            <Icon size={15} strokeWidth={1.9} color={color} />
            <span className="text-[15px] font-semibold text-[#E2E8F0] tabular-nums">
              {value}
              {suffix ?? ""}
            </span>
            <span className="text-[11.5px] font-medium text-[#A0AEC0]">{label}</span>
          </div>
        ))}
      </motion.div>

      {/* ===== URL card ===== */}
      <motion.div variants={rise} className="px-5 mt-7">
        <div
          className="relative rounded-[26px] p-5"
          style={{
            background: "linear-gradient(160deg, rgba(21,26,33,0.92) 0%, rgba(21,26,33,0.82) 100%)",
            border: "1px solid rgba(45,55,72,0.6)",
            boxShadow: "0 26px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
            backdropFilter: "blur(24px)",
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[13px]">
              <Link2 size={13} className="text-[#68D391]" strokeWidth={2.2} />
              <span className="font-semibold text-[#E2E8F0]">New Session</span>
              <span className="text-[#718096]">/</span>
              <span className="text-[#A0AEC0]">Paste Link</span>
            </div>
            <ChevronRight size={16} className="text-[#718096]" />
          </div>

          <h2 className="mt-2.5 text-[21px] font-bold text-white tracking-tight" style={{ letterSpacing: "-0.02em" }}>
            What are we cutting today?
          </h2>
          <p className="mt-1 text-[13.5px] leading-snug text-[#A0AEC0]">
            YouTube or any video link — cut precise clips with bulk timestamps.
          </p>

          {/* input */}
          <div
            className="mt-4 flex items-center gap-2 rounded-2xl px-3.5 min-h-[48px] transition-shadow"
            style={{
              background: "rgba(8,9,11,0.8)",
              border: "1px solid rgba(45,55,72,0.8)",
              boxShadow: "inset 0 2px 8px rgba(0,0,0,0.45)",
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
              className="flex-1 bg-transparent outline-none text-[14.5px] text-white placeholder:text-[#5A6478] py-3"
              aria-label="Video link"
            />
            {url ? (
              <TapButton
                onClick={() => setUrl("")}
                className="p-1.5 rounded-full text-[#718096] hover:text-white transition-colors"
                aria-label="Clear"
              >
                <X size={15} />
              </TapButton>
            ) : (
              clipboardOk && (
                <TapButton
                  onClick={pasteFromClipboard}
                  className="p-1.5 rounded-full text-[#81E6D9]"
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
              className="mt-2.5 flex items-start gap-2 text-[12.5px] text-[#FC8181]"
            >
              <TriangleAlert size={14} className="mt-0.5 shrink-0" />
              <span>{analyzeError}</span>
            </motion.div>
          )}

          <TapButton
            disabled={!canAnalyze}
            onClick={() => void analyze(url.trim())}
            className="mt-4 w-full h-[52px] rounded-full font-semibold text-[15.5px] transition-all flex items-center justify-center gap-2"
            style={{
              background: canAnalyze
                ? "linear-gradient(93deg, #4FD1C5 0%, #63B3ED 55%, #B794F4 120%)"
                : "linear-gradient(160deg, #262e3b, #20262f)",
              color: canAnalyze ? "#08110F" : "#5A6478",
              boxShadow: canAnalyze
                ? "0 12px 34px rgba(79,209,197,0.32), inset 0 1px 0 rgba(255,255,255,0.35)"
                : "inset 0 1px 0 rgba(255,255,255,0.04)",
            }}
          >
            {analyzing ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                Analyzing through the tunnel…
              </>
            ) : (
              <>
                <Scissors size={16} strokeWidth={2.2} />
                Analyze Link
              </>
            )}
          </TapButton>
        </div>
      </motion.div>

      {/* ===== tunnel status pill (like "2 allowed") ===== */}
      <motion.div variants={rise} className="flex justify-center mt-4">
        <div
          className="flex items-center gap-2 rounded-full px-4 py-2"
          style={{ background: "rgba(26,32,44,0.7)", border: "1px solid rgba(45,55,72,0.8)" }}
        >
          <span className="relative flex w-2 h-2">
            <span
              className="absolute inline-flex w-full h-full rounded-full animate-ping"
              style={{ background: tunnel?.warpOn ? "#68D391" : "#FC8181", animationDuration: "1.6s" }}
            />
            <span
              className="relative inline-flex w-2 h-2 rounded-full"
              style={{ background: tunnel?.warpOn ? "#68D391" : "#FC8181" }}
            />
          </span>
          <ShieldCheck size={13} className={tunnel?.warpOn ? "text-[#68D391]" : "text-[#FC8181]"} />
          <span className="text-[12.5px] font-semibold text-[#E2E8F0]">
            {tunnel?.warpOn ? "Tunnel Active" : "Tunnel Reconnecting…"}
          </span>
          <span className="text-[11px] text-[#718096] font-medium tabular-nums">
            {tunnel?.warpOn ? tunnel.egressIp?.replace(/^(.{:]*.:?)/, "WARP ") || "" : ""}
          </span>
          <ChevronRight size={13} className="text-[#718096]" />
        </div>
      </motion.div>

      <motion.p variants={rise} className="text-center text-[12px] text-[#5A6478] font-medium mt-3 mb-2">
        {statusLine}
      </motion.p>
    </motion.div>
  );
}
