"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Hero } from "./Hero";
import { TopBar } from "./TopBar";
import { Rings, clipperMetrics } from "./Rings";
import { AnimatedNumber } from "./AnimatedNumber";
import { TapButton } from "./TapButton";
import {
  AlertGlyph,
  ChevronRight,
  CloseGlyph,
  LinkGlyph,
  MoonIcon,
  PlayGlyph,
  ScissorsGlyph,
  ShieldGlyph,
  TriangleUp,
} from "./icons";
import { useOpal } from "@/lib/clipper/store";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Hairline "brace" that visually connects the score with the three metrics. */
function Brace() {
  return (
    <svg
      width={216}
      height={36}
      viewBox="0 0 216 36"
      fill="none"
      aria-hidden="true"
      className="mx-auto block"
      style={{ overflow: "visible" }}
    >
      <motion.path
        d="M2.5 34.5 V16 A8.6 8.6 0 0 1 11.1 7.6 H100
           C104 7.6 105.4 1.9 108 1.9 C110.6 1.9 112 7.6 116 7.6 H205.4
           A8.6 8.6 0 0 1 214 16 V34.5"
        stroke="#2c322f"
        strokeWidth={1.7}
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.9, ease: EASE, delay: 0.5 }}
      />
      <motion.path
        d="M108 34.5 V4.2"
        stroke="#2c322f"
        strokeWidth={1.7}
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: EASE, delay: 0.8 }}
      />
    </svg>
  );
}

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
  const streak = Math.min(30, 1 + Math.floor(stats.clipsCut / 3));

  const metrics = useMemo(
    () =>
      clipperMetrics({
        clips: stats.clipsCut + readyClips,
        downloads: stats.downloads,
        savedMinutes: Math.round(stats.savedSeconds / 60),
      }),
    [stats.clipsCut, readyClips, stats.downloads, stats.savedSeconds],
  );

  const statusLine = useMemo(() => {
    if (working) return `${clips.filter((c) => c.status === "cutting" || c.status === "queued").length} clips cutting…`;
    if (readyClips > 0) return `${readyClips} clip${readyClips > 1 ? "s" : ""} ready to download`;
    return "Paste any video link to begin";
  }, [working, clips, readyClips]);

  const canAnalyze = /^https?:\/\//i.test(url.trim()) && !analyzing;

  return (
    <div className="flex flex-col">
      {/* ===== hero art with TopBar overlay ===== */}
      <div className="relative">
        <Hero height={400} />
        <div className="absolute inset-x-0 top-0">
          <TopBar streak={streak} />
        </div>
      </div>

      {/* ===== Score ===== */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE, delay: 0.25 }}
        className="flex flex-col items-center"
      >
        <span className="t-score-label" style={{ display: "inline-block", lineHeight: "15px" }}>
          Score
        </span>
        <div className="flex items-center gap-2.5 mt-1">
          <AnimatedNumber value={totalScore} className="t-score-value" style={{ transform: "translateX(1.55px)" }} />
          {totalScore > 0 && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 16, delay: 0.25 }}
              style={{
                display: "block",
                width: 16.9,
                height: 15.2,
                color: "#BDF7E4",
                filter: "drop-shadow(0 0 6px rgba(160,255,215,0.45))",
              }}
            >
              <TriangleUp style={{ width: 16.9, height: 15.2 }} />
            </motion.span>
          )}
        </div>
        <span className="text-[12.5px] mt-1.5" style={{ color: "#9db0a8" }}>
          clips cut all-time
        </span>
      </motion.div>

      {/* ===== brace + rings ===== */}
      <div className="mt-1">
        <Brace />
      </div>
      <Rings metrics={metrics} />

      {/* ===== URL card — the reference sleep-insight surface ===== */}
      <motion.section
        aria-label="New session"
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.75, ease: EASE, delay: 0.75 }}
        className="mx-5 mt-5 opal-card"
        style={{ borderRadius: 42, padding: "26px 24px 24px" }}
      >
        {/* header row — session · paste link (reference pattern) */}
        <div className="flex items-center" style={{ height: 16 }}>
          <MoonIcon style={{ width: 13, height: 13 }} />
          <span className="t-card-meta" style={{ marginLeft: 7.4, lineHeight: "13px", display: "block" }}>
            New session
          </span>
          <span
            aria-hidden="true"
            style={{
              marginLeft: 9.7,
              marginRight: 10.3,
              width: 1.6,
              height: 12,
              borderRadius: 1,
              background: "rgba(190,214,201,0.28)",
              transform: "rotate(13deg)",
              display: "block",
            }}
          />
          <ScissorsGlyph style={{ width: 15.5, height: 15.5 }} />
          <span className="t-card-meta" style={{ marginLeft: 8.4, lineHeight: "13px", display: "block" }}>
            Paste link
          </span>
        </div>

        {/* copy */}
        <div style={{ marginTop: 22 }}>
          <h2 className="t-card-title" style={{ margin: 0, height: 17, lineHeight: "17px" }}>
            What are we cutting today?
          </h2>
          <p className="t-card-body" style={{ margin: "5px 0 0", maxWidth: 268, lineHeight: "22px" }}>
            YouTube or any video link — precise, bulk timestamps.
          </p>
        </div>

        {/* input */}
        <div
          className="opal-input mt-4 flex items-center gap-2 px-4"
          style={{ minHeight: 48, borderRadius: 16 }}
        >
          <LinkGlyph style={{ width: 17, height: 17, color: "#8fbfae", flex: "none" }} />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canAnalyze) void analyze(url.trim());
            }}
            placeholder="https://youtube.com/watch?v=…"
            spellCheck={false}
            autoCapitalize="none"
            className="flex-1 bg-transparent outline-none text-[14.5px] py-3 opal-placeholder"
            style={{ color: "#ffffff", caretColor: "#CDFCE2", letterSpacing: "-0.011em" }}
            aria-label="Video link"
          />
          {url ? (
            <TapButton
              onClick={() => setUrl("")}
              className="p-1.5 rounded-full"
              style={{ color: "#9db0a8" }}
              aria-label="Clear"
            >
              <CloseGlyph style={{ width: 14, height: 14 }} />
            </TapButton>
          ) : (
            clipboardOk && (
              <TapButton
                onClick={pasteFromClipboard}
                className="p-1.5 rounded-full"
                style={{ color: "#CDFCE2" }}
                aria-label="Paste from clipboard"
              >
                <LinkGlyph style={{ width: 16, height: 16 }} />
              </TapButton>
            )
          )}
        </div>

        {analyzeError && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 flex items-start gap-2 px-1"
            style={{ color: "#eb5757" }}
          >
            <AlertGlyph style={{ width: 15, height: 14, marginTop: 1, flex: "none" }} />
            <span className="text-[12.5px] leading-snug">{analyzeError}</span>
          </motion.div>
        )}

        {/* CTA — the green reference button */}
        <TapButton
          disabled={!canAnalyze}
          onClick={() => void analyze(url.trim())}
          className="opal-cta mt-4 w-full gap-2.5"
          style={{ height: 48, borderRadius: 24, fontSize: 16 }}
        >
          {analyzing ? (
            <>
              <Loader2 size={16} className="animate-spin" style={{ color: "#CDFCE2" }} />
              <span className="t-button">Analyzing through the tunnel…</span>
            </>
          ) : (
            <>
              <motion.span
                aria-hidden="true"
                animate={{ x: [-1.5, 1.5, -1.5] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                style={{ display: "block", width: 10, height: 11, color: "#dcf1ee", filter: "drop-shadow(0 0 4px rgba(210,255,240,0.35))" }}
              >
                <PlayGlyph style={{ width: 10, height: 11 }} />
              </motion.span>
              <span className="t-button">Analyze Link</span>
            </>
          )}
        </TapButton>
      </motion.section>

      {/* ===== tunnel pill — the “2 allowed” floating pill ===== */}
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 26, delay: 1.05 }}
        className="flex justify-center mt-5"
      >
        <div
          className="opal-chip flex items-center px-4"
          style={{ height: 41, borderRadius: 20.5, gap: 8 }}
          title="WARP tunnel egress"
        >
          <span className="relative flex" style={{ width: 7, height: 7 }}>
            <span
              className="absolute inline-flex w-full h-full rounded-full animate-ping"
              style={{
                background: tunnel?.warpOn ? "#8fe3b8" : "#eb5757",
                animationDuration: "1.8s",
              }}
            />
            <span
              className="relative inline-flex w-full h-full rounded-full"
              style={{ background: tunnel?.warpOn ? "#8fe3b8" : "#eb5757" }}
            />
          </span>
          <ShieldGlyph
            style={{
              width: 13,
              height: 14,
              color: tunnel?.warpOn ? "#8fe3b8" : "#eb5757",
              flex: "none",
            }}
          />
          <span className="t-pill" style={{ fontSize: 14, lineHeight: "17px", whiteSpace: "nowrap" }}>
            {tunnel?.warpOn ? "Tunnel Active" : "Reconnecting…"}
          </span>
          {tunnel?.warpOn && tunnel.egressIp && (
            <>
              <span
                aria-hidden="true"
                style={{ width: 3.6, height: 3.6, borderRadius: 999, background: "rgba(190,214,201,0.28)" }}
              />
              <span className="mono-meta text-[11px]" style={{ color: "#9db0a8" }}>
                {tunnel.egressIp}
              </span>
            </>
          )}
          <motion.span
            aria-hidden="true"
            animate={{ x: [0, 2.5, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
            style={{ display: "block", width: 6.6, height: 12, color: "#AEB6B2" }}
          >
            <ChevronRight style={{ width: 6.6, height: 12 }} />
          </motion.span>
        </div>
      </motion.div>

      <p className="text-center text-[12px] mt-3.5 mb-2" style={{ color: "#9db0a8" }}>
        {statusLine}
      </p>
    </div>
  );
}
