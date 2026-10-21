"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { ClipCard } from "./ClipCard";
import { QualitySheet } from "./QualitySheet";
import { TapButton } from "./TapButton";
import {
  ChevronDown,
  CloseGlyph,
  ScissorsGlyph,
  SquareFilledGlyph,
  SquareOutlineGlyph,
  ZipGlyph,
} from "./icons";
import { useOpal } from "@/lib/clipper/store";
import type { Clip } from "@/lib/clipper/types";

export function ClipsScreen() {
  const { clips, videos, renders, selectMode, setSelectMode, selected, toggleSelect, clearSelection, stats, bumpStats, downloadedRenderIds, registerAutoDownload, setTab } = useOpal();
  const [sheetClip, setSheetClip] = useState<Clip | undefined>();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [bulkSheet, setBulkSheet] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [pendingZip, setPendingZip] = useState<{ renderIds: string[]; label: string } | null>(null);

  // group clips by video
  const groups = useMemo(() => {
    const m = new Map<string, Clip[]>();
    for (const c of clips) {
      const arr = m.get(c.videoId) || [];
      arr.push(c);
      m.set(c.videoId, arr);
    }
    return [...m.entries()].sort((a, b) => Math.max(...b[1].map((c) => c.createdAt)) - Math.max(...a[1].map((c) => c.createdAt)));
  }, [clips]);

  // bulk ZIP auto-trigger when all renders ready
  useEffect(() => {
    if (!pendingZip) return;
    const rs = pendingZip.renderIds.map((id) => renders.find((r) => r.id === id));
    const all = rs.length > 0 && rs.every((r) => r?.status === "ready");
    const anyErr = rs.some((r) => r?.status === "error");
    if (all) {
      const fresh = rs.some((r) => r && !downloadedRenderIds.has(r.id));
      if (fresh) {
        rs.forEach((r) => r && registerAutoDownload(r.id));
        bumpStats({ downloads: stats.downloads + rs.length });
        const a = document.createElement("a");
        a.href = `/api/zip?ids=${pendingZip.renderIds.join(",")}`;
        a.download = "opal-clips.zip";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
      const t = setTimeout(() => setPendingZip(null), 0);
      return () => clearTimeout(t);
    }
    if (anyErr) {
      const t = setTimeout(() => setPendingZip(null), 0);
      return () => clearTimeout(t);
    }
  }, [renders, pendingZip, downloadedRenderIds, registerAutoDownload, bumpStats, stats.downloads]);

  const openQuality = (clip: Clip) => {
    setSheetClip(clip);
    setSheetOpen(true);
  };

  const openBulk = () => {
    setBulkSheet(true);
  };

  const selectedIds = [...selected];
  const allReadySelected = selectedIds.length > 0 && selectedIds.every((id) => clips.find((c) => c.id === id)?.status === "ready");

  return (
    <div className="relative pb-24">
      {/* header */}
      <div
        className="flex items-center justify-between px-6 pt-4 pb-3 sticky top-0 z-10"
        style={{ background: "linear-gradient(to bottom, #0b0e0d 60%, transparent)" }}
      >
        <div>
          <h1 className="text-[26px] text-white" style={{ fontWeight: 510, letterSpacing: "-0.022em" }}>
            My Clips
          </h1>
          <p className="mono-meta text-[10.5px] mt-1" style={{ color: "#9db0a8" }}>
            {clips.length ? `${clips.length} CLIPS · TAP PLAY TO PREVIEW` : "YOUR CUT CLIPS LIVE HERE"}
          </p>
        </div>
        {clips.length > 0 && (
          <TapButton
            onClick={() => setSelectMode(!selectMode)}
            className="flex items-center gap-1.5 text-[12.5px]"
            style={
              selectMode
                ? {
                    height: 32,
                    padding: "0 14px",
                    borderRadius: 16,
                    background: "rgba(183,247,230,0.1)",
                    color: "#CDFCE2",
                    boxShadow: "inset 0 0 0 1px rgba(183,247,230,0.35)",
                  }
                : {
                    height: 32,
                    padding: "0 14px",
                    borderRadius: 16,
                    background: "transparent",
                    color: "#9db0a8",
                    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.07)",
                  }
            }
          >
            {selectMode ? (
              <SquareFilledGlyph style={{ width: 13, height: 13 }} />
            ) : (
              <SquareOutlineGlyph style={{ width: 13, height: 13 }} />
            )}
            {selectMode ? "Done" : "Select"}
          </TapButton>
        )}
      </div>

      {/* groups */}
      <div className="px-5">
        {groups.map(([videoId, groupClips]) => {
          const video = videos.find((v) => v.id === videoId);
          const isCollapsed = collapsed.has(videoId);
          const allGroupSelected = groupClips.every((c) => selected.has(c.id));
          return (
            <motion.section
              key={videoId}
              layout
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              {/* video group header */}
              <TapButton
                onClick={() =>
                  setCollapsed((prev) => {
                    const n = new Set(prev);
                    if (n.has(videoId)) n.delete(videoId);
                    else n.add(videoId);
                    return n;
                  })
                }
                className="w-full flex items-center gap-3 mb-3 text-left"
              >
                <img
                  src={video?.thumbnail}
                  alt=""
                  className="w-16 aspect-video object-cover"
                  style={{ borderRadius: 12, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.09)" }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] truncate" style={{ color: "#d7dfdb" }}>
                    {video?.title || "Video"}
                  </p>
                  <p className="mono-meta text-[10px] mt-0.5" style={{ color: "#9db0a8" }}>
                    {groupClips.length} CLIP{groupClips.length > 1 ? "S" : ""}
                    {video?.heights?.[0]
                      ? ` · UP TO ${video.heights[0] >= 2160 ? "4K " : video.heights[0] >= 1440 ? "2K " : ""}${video.heights[0]}P`
                      : ""}
                  </p>
                </div>
                {selectMode ? (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      const cur = useOpal.getState().selected;
                      const next = new Set(cur);
                      if (allGroupSelected) groupClips.forEach((c) => next.delete(c.id));
                      else groupClips.forEach((c) => next.add(c.id));
                      useOpal.setState({ selected: next });
                    }}
                    className="p-2"
                  >
                    <SquareFilledGlyph
                      style={{ width: 16, height: 16, color: allGroupSelected ? "#CDFCE2" : "#9db0a8" }}
                    />
                  </span>
                ) : (
                  <ChevronDown
                    style={{
                      width: 15,
                      height: 9,
                      color: "#9db0a8",
                      transform: isCollapsed ? "rotate(180deg)" : "none",
                      transition: "transform .25s ease",
                    }}
                  />
                )}
              </TapButton>

              {!isCollapsed && (
                <motion.div layout className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))" }}>
                  <AnimatePresence mode="popLayout">
                    {groupClips.map((c) => (
                      <ClipCard key={c.id} clip={c} video={video} onQuality={openQuality} />
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </motion.section>
          );
        })}

        {/* empty state */}
        {clips.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center pt-6">
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              style={{ color: "#CDFCE2", filter: "drop-shadow(0 0 18px rgba(183,247,230,0.4))" }}
            >
              <ScissorsGlyph style={{ width: 50, height: 50 }} />
            </motion.div>
            <p className="text-[16px] mt-3" style={{ color: "#ffffff", fontWeight: 510 }}>
              No clips yet
            </p>
            <p className="text-[12.5px] mt-1.5 text-center px-12 leading-relaxed" style={{ color: "#9db0a8" }}>
              Home pe link paste karo, timestamps do — clips yahan card mein aa jayengi.
            </p>
            <TapButton
              onClick={() => setTab("home")}
              className="opal-cta mt-5 px-6"
              style={{ height: 44, borderRadius: 22, fontSize: 14 }}
            >
              <span className="t-button" style={{ fontSize: 14 }}>Cut your first clip</span>
            </TapButton>
          </motion.div>
        )}
      </div>

      {/* ===== bulk bottom bar ===== */}
      <AnimatePresence>
        {selectMode && selected.size > 0 && (
          <motion.div
            initial={{ y: 90, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 90, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="absolute bottom-4 inset-x-4 z-20"
          >
            <div
              className="flex items-center gap-3 p-3"
              style={{
                borderRadius: 24,
                background: "rgba(16,18,17,0.92)",
                backdropFilter: "blur(24px)",
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.07), 0 16px 48px rgba(0,0,0,0.5)",
              }}
            >
              <TapButton
                onClick={clearSelection}
                className="grid place-items-center"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.04)",
                  boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.07)",
                  color: "#9db0a8",
                }}
              >
                <CloseGlyph style={{ width: 13, height: 13 }} />
              </TapButton>
              <div className="flex-1">
                <p className="text-[14px]" style={{ color: "#ffffff", fontWeight: 510 }}>
                  {selected.size} selected
                </p>
                {pendingZip ? (
                  <p className="mono-meta text-[10.5px]" style={{ color: "#CDFCE2" }}>
                    RENDERING & ZIPPING…
                  </p>
                ) : (
                  <p className="text-[11px]" style={{ color: "#9db0a8" }}>
                    bulk download as ZIP
                  </p>
                )}
              </div>
              <TapButton
                onClick={openBulk}
                disabled={!allReadySelected || !!pendingZip}
                className="opal-cta px-5 gap-2"
                style={{ height: 40, borderRadius: 20, fontSize: 13 }}
              >
                {pendingZip ? (
                  <Loader2 size={14} className="animate-spin" style={{ color: "#CDFCE2" }} />
                ) : (
                  <ZipGlyph style={{ width: 15, height: 15, color: "#dfeeeb" }} />
                )}
                <span className="t-button" style={{ fontSize: 13 }}>
                  {pendingZip ? "Zipping" : `Download ${selected.size}`}
                </span>
              </TapButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* sheets */}
      <QualitySheet
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          setSheetClip(undefined);
        }}
        clip={sheetClip}
      />
      <QualitySheet
        open={bulkSheet}
        onClose={() => setBulkSheet(false)}
        bulkIds={selectedIds.filter((id) => clips.find((c) => c.id === id)?.status === "ready")}
        onStarted={(renderIds) => setPendingZip({ renderIds, label: "zip" })}
      />
    </div>
  );
}
