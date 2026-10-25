"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { ClipboardPaste, Link2, Music, ScanSearch, ShieldCheck, Zap } from "lucide-react";
import { useOpal } from "@/lib/clipper/store";
import { toast } from "./toast";
import { HistoryPanel } from "./history-panel";
import { dockIn, item, stagger } from "./anim";

export function HomeScreen() {
  const analyzing = useOpal((s) => s.analyzing);
  const analyzeError = useOpal((s) => s.analyzeError);
  const analyze = useOpal((s) => s.analyze);
  const [url, setUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const doAnalyze = async () => {
    const u = url.trim();
    if (!/^https?:\/\/\S+\.\S+/.test(u)) {
      toast("Paste a valid video link");
      inputRef.current?.focus();
      return;
    }
    await analyze(u);
  };

  return (
    <>
      <motion.div variants={stagger} initial="hidden" animate="show">
        <motion.h1 variants={item}>Clip any video</motion.h1>
        <motion.p className="sub" variants={item}>
          Paste a link from YouTube or any supported site.
        </motion.p>

        <motion.div className="field" variants={item}>
          <Link2 className="lucide" style={{ color: "var(--mut)" }} />
          <input
            ref={inputRef}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            placeholder="https://youtu.be/…"
            disabled={analyzing}
            onKeyDown={(e) => {
              if (e.key === "Enter") void doAnalyze();
            }}
          />
          <button
            className="ib"
            aria-label="Paste"
            disabled={analyzing}
            onClick={async () => {
              try {
                setUrl(await navigator.clipboard.readText());
              } catch {
                toast("Long-press the field to paste");
              }
            }}
          >
            <ClipboardPaste className="lucide sm" style={{ color: "var(--mut)" }} />
          </button>
        </motion.div>

        {analyzing ? (
          <motion.div variants={item} style={{ marginTop: 18 }}>
            <div className="skel" />
            <div className="skel short" />
          </motion.div>
        ) : null}

        {analyzeError && !analyzing ? (
          <motion.div className="bad" variants={item} style={{ padding: "0 6px" }}>
            {analyzeError}
          </motion.div>
        ) : null}

        <motion.div className="q" variants={item} style={{ marginTop: 16, marginBottom: 0 }}>
          <span className="chip quiet">
            <Zap className="lucide" /> Up to 4K
          </span>
          <span className="chip quiet">
            <Music className="lucide" /> Original audio
          </span>
          <span className="chip quiet">
            <ShieldCheck className="lucide" /> Local-only history
          </span>
        </motion.div>

        <HistoryPanel />
      </motion.div>

      <div className="dock">
        <motion.button
          className="btn"
          variants={dockIn}
          initial="hidden"
          animate="show"
          onClick={() => void doAnalyze()}
          disabled={analyzing}
        >
          <ScanSearch className="lucide" />
          {analyzing ? "Analyzing…" : "Analyze link"}
        </motion.button>
      </div>
    </>
  );
}
