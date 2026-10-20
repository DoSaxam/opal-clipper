"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckSquare, Square, X, Package, ChevronDown, ChevronUp, Download } from "lucide-react";
import { ClipCard } from "./ClipCard";
import { QualitySheet } from "./QualitySheet";
import { PrismHero } from "./PrismHero";
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
        style={{ background: "linear-gradient(to bottom, #08090A 60%, transparent)" }}
      >
        <div>
          <h1 className="text-[26px] text-paper type-heading">My Clips</h1>
          <p className="mono-meta text-[10.5px] text-ash mt-1">
            {clips.length ? `${clips.length} CLIPS · TAP PLAY TO PREVIEW` : "YOUR CUT CLIPS LIVE HERE"}
          </p>
        </div>
        {clips.length > 0 && (
          <TapButton
            onClick={() => setSelectMode(!selectMode)}
            className="h-[32px] px-3.5 rounded-[6px] flex items-center gap-1.5 text-[12.5px] transition-colors"
            style={
              selectMode
                ? { background: "rgba(228,242,34,0.1)", color: "#E4F222", boxShadow: "rgba(228,242,34,0.35) 0 0 0 1px inset" }
                : { background: "transparent", color: "#8A8F98", boxShadow: "#23252A 0 0 0 1px inset" }
            }
          >
            {selectMode ? <CheckSquare size={13} /> : <Square size={13} />}
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
                  className="w-16 aspect-video rounded-[6px] object-cover"
                  style={{ boxShadow: "#383B3F 0 0 0 1px inset" }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-mist truncate">{video?.title || "Video"}</p>
                  <p className="mono-meta text-[10px] text-ash mt-0.5">
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
                    <CheckSquare size={16} className={allGroupSelected ? "text-acid" : "text-ash"} />
                  </span>
                ) : isCollapsed ? (
                  <ChevronDown size={15} className="text-ash" />
                ) : (
                  <ChevronUp size={15} className="text-ash" />
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
            <PrismHero size={86} />
            <p className="text-[16px] text-paper mt-2" style={{ fontWeight: 510 }}>No clips yet</p>
            <p className="text-[12.5px] text-ash mt-1.5 text-center px-12 leading-relaxed">
              Home pe link paste karo, timestamps do — clips yahan card mein aa jayengi.
            </p>
            <TapButton
              onClick={() => setTab("home")}
              className="btn-acid acid-sweep mt-5 h-11 px-6 text-[14px] flex items-center gap-2"
            >
              <Download size={14} /> Cut your first clip
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
              className="rounded-[12px] p-3 flex items-center gap-3"
              style={{
                background: "rgba(22,23,24,0.92)",
                backdropFilter: "blur(24px)",
                boxShadow: "#383B3F 0 0 0 1px inset, rgba(0,0,0,0.5) 0 16px 48px",
              }}
            >
              <TapButton
                onClick={clearSelection}
                className="w-8 h-8 rounded-[6px] grid place-items-center"
                style={{ background: "rgba(255,255,255,0.04)", boxShadow: "#23252A 0 0 0 1px inset" }}
              >
                <X size={13} className="text-fog" />
              </TapButton>
              <div className="flex-1">
                <p className="text-[14px] text-paper" style={{ fontWeight: 510 }}>
                  {selected.size} selected
                </p>
                {pendingZip ? (
                  <p className="mono-meta text-[10.5px] text-acid">RENDERING & ZIPPING…</p>
                ) : (
                  <p className="text-[11px] text-fog">bulk download as ZIP</p>
                )}
              </div>
              <TapButton
                onClick={openBulk}
                disabled={!allReadySelected || !!pendingZip}
                className="btn-acid acid-sweep h-[40px] px-5 text-[13px] flex items-center gap-2"
              >
                <Package size={14} />
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
