"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckSquare, Square, X, Package, ChevronDown, ChevronUp, Download } from "lucide-react";
import { ClipCard } from "./ClipCard";
import { QualitySheet } from "./QualitySheet";
import { GemHero } from "./GemHero";
import { TapButton } from "./TapButton";
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
    // newest video first (by newest clip in group)
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
      <div className="flex items-center justify-between px-6 pt-4 pb-3 sticky top-0 z-10" style={{ background: "linear-gradient(to bottom, #0A0B0D 60%, transparent)" }}>
        <div>
          <h1 className="text-[28px] font-bold text-white tracking-tight" style={{ letterSpacing: "-0.03em" }}>
            My Clips
          </h1>
          <p className="text-[12.5px] text-[#A0AEC0] mt-0.5">
            {clips.length ? `${clips.length} clip${clips.length > 1 ? "s" : ""} · tap play to preview` : "your cut clips live here"}
          </p>
        </div>
        {clips.length > 0 && (
          <TapButton
            onClick={() => setSelectMode(!selectMode)}
            className="h-9 px-3.5 rounded-full flex items-center gap-1.5 text-[12.5px] font-semibold"
            style={{
              background: selectMode ? "rgba(129,230,217,0.14)" : "#232a36",
              color: selectMode ? "#81E6D9" : "#A0AEC0",
              border: selectMode ? "1px solid rgba(129,230,217,0.35)" : "1px solid rgba(45,55,72,0.9)",
            }}
          >
            {selectMode ? <CheckSquare size={14} /> : <Square size={14} />}
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
                  className="w-16 aspect-video rounded-lg object-cover"
                  style={{ border: "1px solid rgba(45,55,72,0.8)" }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-semibold text-[#E2E8F0] truncate">{video?.title || "Video"}</p>
                  <p className="text-[11px] text-[#718096] mt-0.5">
                    {groupClips.length} clip{groupClips.length > 1 ? "s" : ""}
                    {video?.heights?.[0]
                      ? ` · up to ${video.heights[0] >= 2160 ? "4K " : video.heights[0] >= 1440 ? "2K " : ""}${video.heights[0]}p`
                      : ""}
                  </p>
                </div>
                {selectMode ? (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      // select-all / deselect-all for this group
                      const cur = useOpal.getState().selected;
                      const next = new Set(cur);
                      if (allGroupSelected) groupClips.forEach((c) => next.delete(c.id));
                      else groupClips.forEach((c) => next.add(c.id));
                      useOpal.setState({ selected: next });
                    }}
                    className="p-2"
                  >
                    <CheckSquare size={17} className={allGroupSelected ? "text-[#81E6D9]" : "text-[#718096]"} />
                  </span>
                ) : (
                  isCollapsed ? <ChevronDown size={16} className="text-[#718096]" /> : <ChevronUp size={16} className="text-[#718096]" />
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
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center pt-8">
            <GemHero size={140} mini />
            <p className="text-[16px] font-semibold text-[#E2E8F0] mt-4">No clips yet</p>
            <p className="text-[12.5px] text-[#718096] mt-1.5 text-center px-12 leading-relaxed">
              Home pe link paste karo, timestamps do — clips yahan card mein aa jayengi.
            </p>
            <TapButton
              onClick={() => setTab("home")}
              className="mt-5 h-11 px-6 rounded-full text-[14px] font-semibold flex items-center gap-2"
              style={{
                background: "linear-gradient(93deg, #4FD1C5 0%, #63B3ED 55%, #B794F4 120%)",
                color: "#08110F",
              }}
            >
              <Download size={15} /> Cut your first clip
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
              className="rounded-[22px] p-3 flex items-center gap-3"
              style={{
                background: "rgba(26,32,44,0.92)",
                backdropFilter: "blur(24px)",
                border: "1px solid rgba(129,230,217,0.3)",
                boxShadow: "0 18px 50px rgba(0,0,0,0.6)",
              }}
            >
              <TapButton onClick={clearSelection} className="w-8 h-8 rounded-full grid place-items-center bg-white/5">
                <X size={14} className="text-[#A0AEC0]" />
              </TapButton>
              <div className="flex-1">
                <p className="text-[14px] font-bold text-white">
                  {selected.size} selected
                </p>
                {pendingZip ? (
                  <p className="text-[11px] text-[#81E6D9] font-medium">rendering & zipping…</p>
                ) : (
                  <p className="text-[11px] text-[#A0AEC0]">bulk download as ZIP</p>
                )}
              </div>
              <TapButton
                onClick={openBulk}
                disabled={!allReadySelected || !!pendingZip}
                className="h-11 px-5 rounded-full text-[13.5px] font-bold flex items-center gap-2"
                style={{
                  background: allReadySelected && !pendingZip
                    ? "linear-gradient(93deg, #4FD1C5 0%, #63B3ED 60%, #B794F4 120%)"
                    : "#232a36",
                  color: allReadySelected && !pendingZip ? "#08110F" : "#5A6478",
                }}
              >
                <Package size={15} />
                Download {selected.size}
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
