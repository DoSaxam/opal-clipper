"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckSquare,
  Square,
  X,
  Package,
  ChevronDown,
  ChevronUp,
  Scissors,
} from "lucide-react";
import { ClipCard } from "./ClipCard";
import { QualityDrawer } from "./QualityDrawer";
import { GemHero } from "./GemHero";
import { Thumb } from "./Thumb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useOpal } from "@/lib/clipper/store";
import type { Clip } from "@/lib/clipper/types";

export function ClipsScreen() {
  const {
    clips,
    videos,
    renders,
    selectMode,
    setSelectMode,
    selected,
    toggleSelect,
    clearSelection,
    stats,
    bumpStats,
    downloadedRenderIds,
    registerAutoDownload,
    setTab,
  } = useOpal();

  const [sheetClip, setSheetClip] = useState<Clip | undefined>();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [bulkSheet, setBulkSheet] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [pendingZip, setPendingZip] = useState<string[] | null>(null);

  const groups = useMemo(() => {
    const m = new Map<string, Clip[]>();
    for (const c of clips) {
      const arr = m.get(c.videoId) || [];
      arr.push(c);
      m.set(c.videoId, arr);
    }
    return [...m.entries()].sort(
      (a, b) =>
        Math.max(...b[1].map((c) => c.createdAt)) -
        Math.max(...a[1].map((c) => c.createdAt))
    );
  }, [clips]);

  /* bulk ZIP: fire the download as soon as every render in the batch is ready */
  useEffect(() => {
    if (!pendingZip) return;
    const rs = pendingZip.map((id) => renders.find((r) => r.id === id));
    const allReady = rs.length > 0 && rs.every((r) => r?.status === "ready");
    const anyErr = rs.some((r) => r?.status === "error");
    if (allReady) {
      const fresh = rs.some((r) => r && !downloadedRenderIds.has(r.id));
      if (fresh) {
        rs.forEach((r) => r && registerAutoDownload(r.id));
        bumpStats({ downloads: stats.downloads + rs.length });
        const a = document.createElement("a");
        a.href = `/api/zip?ids=${pendingZip.join(",")}`;
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

  const selectedIds = [...selected];
  const allReadySelected =
    selectedIds.length > 0 &&
    selectedIds.every((id) => clips.find((c) => c.id === id)?.status === "ready");

  return (
    <div className="pb-24">
      {/* header */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[27px] font-bold tracking-[-0.03em] text-foreground">
            My Clips
          </h1>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">
            {clips.length
              ? `${clips.length} clip${clips.length > 1 ? "s" : ""} · tap play to preview`
              : "your cut clips live here"}
          </p>
        </div>
        {clips.length > 0 && (
          <Button
            variant={selectMode ? "default" : "secondary"}
            size="sm"
            onClick={() => setSelectMode(!selectMode)}
            className="mt-1 gap-1.5 rounded-full"
          >
            {selectMode ? <CheckSquare className="size-3.5" /> : <Square className="size-3.5" />}
            {selectMode ? "Done" : "Select"}
          </Button>
        )}
      </div>

      {/* groups */}
      {groups.map(([videoId, groupClips]) => {
        const video = videos.find((v) => v.id === videoId);
        const isCollapsed = collapsed.has(videoId);
        const allGroupSelected = groupClips.every((c) => selected.has(c.id));
        return (
          <motion.section
            key={videoId}
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <button
              onClick={() =>
                setCollapsed((prev) => {
                  const n = new Set(prev);
                  if (n.has(videoId)) n.delete(videoId);
                  else n.add(videoId);
                  return n;
                })
              }
              className="mb-3 flex w-full items-center gap-3 text-left"
            >
              <Thumb
                videoId={videoId}
                alt=""
                className="h-9 w-16 shrink-0 rounded-lg"
                style={{ border: "1px solid var(--hairline)" }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-semibold text-foreground">
                  {video?.title || "Video"}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {groupClips.length} clip{groupClips.length > 1 ? "s" : ""}
                  {video?.heights?.[0]
                    ? ` · up to ${
                        video.heights[0] >= 2160
                          ? "4K "
                          : video.heights[0] >= 1440
                            ? "2K "
                            : ""
                      }${video.heights[0]}p`
                    : ""}
                </p>
              </div>
              {selectMode ? (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    const next = new Set(useOpal.getState().selected);
                    if (allGroupSelected) groupClips.forEach((c) => next.delete(c.id));
                    else groupClips.forEach((c) => next.add(c.id));
                    useOpal.setState({ selected: next });
                  }}
                  className="p-2"
                >
                  <CheckSquare
                    className={
                      allGroupSelected
                        ? "size-4 text-primary"
                        : "size-4 text-muted-foreground"
                    }
                  />
                </span>
              ) : isCollapsed ? (
                <ChevronDown className="size-4 text-muted-foreground" />
              ) : (
                <ChevronUp className="size-4 text-muted-foreground" />
              )}
            </button>

            {!isCollapsed && (
              <motion.div
                layout
                className="grid gap-3.5"
                style={{
                  gridTemplateColumns:
                    "repeat(auto-fill, minmax(min(100%, 300px), 1fr))",
                }}
              >
                <AnimatePresence mode="popLayout">
                  {groupClips.map((c) => (
                    <ClipCard
                      key={c.id}
                      clip={c}
                      video={video}
                      onQuality={(clip) => {
                        setSheetClip(clip);
                        setSheetOpen(true);
                      }}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </motion.section>
        );
      })}

      {/* empty */}
      {clips.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center pt-6"
        >
          <GemHero size={130} mini />
          <p className="mt-4 text-[16px] font-semibold text-foreground">No clips yet</p>
          <p className="mt-1.5 px-10 text-center text-[12.5px] leading-relaxed text-muted-foreground">
            Home pe link paste karo, timestamps do — clips yahan card mein aa
            jayengi.
          </p>
          <Button
            onClick={() => setTab("home")}
            className="mt-5 h-11 gap-2 rounded-full px-6 text-[14px]"
          >
            <Scissors className="size-4" />
            Cut your first clip
          </Button>
        </motion.div>
      )}

      {/* bulk bar */}
      <AnimatePresence>
        {selectMode && selected.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="fixed inset-x-0 bottom-[68px] z-30 px-4 safe-bottom lg:bottom-6 lg:left-auto lg:right-6 lg:px-0"
          >
            <div className="surface-glass mx-auto flex max-w-3xl items-center gap-3 rounded-2xl p-3">
              <Button
                variant="secondary"
                size="icon-sm"
                onClick={clearSelection}
                aria-label="Clear selection"
                className="rounded-full"
              >
                <X className="size-3.5" />
              </Button>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold text-foreground">
                  {selected.size} selected
                </p>
                {pendingZip ? (
                  <p className="text-[11px] font-medium text-primary">
                    rendering &amp; zipping…
                  </p>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    bulk download as ZIP
                  </p>
                )}
              </div>
              <Button
                onClick={() => setBulkSheet(true)}
                disabled={!allReadySelected || !!pendingZip}
                className="h-11 gap-2 rounded-full px-5 text-[13.5px]"
              >
                <Package className="size-4" />
                Download {selected.size}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* drawers */}
      <QualityDrawer
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          setSheetClip(undefined);
        }}
        clip={sheetClip}
      />
      <QualityDrawer
        open={bulkSheet}
        onClose={() => setBulkSheet(false)}
        bulkIds={selectedIds.filter(
          (id) => clips.find((c) => c.id === id)?.status === "ready"
        )}
        onStarted={(ids) => setPendingZip(ids)}
      />
    </div>
  );
}
