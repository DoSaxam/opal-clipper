"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Archive, CheckSquare, Loader2, Trash2, X } from "lucide-react";
import { useOpal } from "@/lib/clipper/store";
import { fmtBytes } from "@/lib/clipper/types";
import { clipColor, ladderFor, tierLabel } from "@/lib/clipper/qualities";
import { ClipCard } from "./clip-card";
import { toast } from "./toast";
import { useActiveVideo } from "./use-active-video";
import { ExpiredView } from "./expired";
import { dockIn, item, stagger } from "./anim";

/**
 * Clips ready screen.
 *
 * Three MANUAL download paths (nothing ever auto-downloads):
 *   1. per-card download button (renders the selected quality, then downloads)
 *   2. "Render all" -> "Download ZIP" main dock button
 *   3. Select mode + checkboxes -> ZIP of only the selected clips
 * File sizes shown are REAL disk sizes from the server, never estimates.
 */
export function ClipsScreen() {
  const video = useActiveVideo();
  const go = useOpal((s) => s.go);
  const allClips = useOpal((s) => s.clips);
  const allRenders = useOpal((s) => s.renders);
  const activeVideoId = useOpal((s) => s.activeVideoId);
  const q = useOpal((s) => s.quality);
  const setQuality = useOpal((s) => s.setQuality);
  const selectMode = useOpal((s) => s.selectMode);
  const setSelectMode = useOpal((s) => s.setSelectMode);
  const selected = useOpal((s) => s.selected);
  const startRender = useOpal((s) => s.startRender);
  const downloadZip = useOpal((s) => s.downloadZip);
  const deleteClips = useOpal((s) => s.deleteClips);

  const clips = useMemo(
    () =>
      allClips
        .filter((c) => c.videoId === activeVideoId)
        .sort((a, b) => a.createdAt - b.createdAt),
    [allClips, activeVideoId]
  );

  if (!video || !clips.length) return <ExpiredView onHome={() => go(0)} />;

  const ladder = ladderFor(video);
  const target = selectMode ? clips.filter((c) => selected.has(c.id)) : clips;
  const readyRenders = target.map((c) =>
    allRenders.find((r) => r.clipId === c.id && r.quality === q && r.status === "ready")
  );
  const allReady = target.length > 0 && readyRenders.every(Boolean);
  const totalBytes = readyRenders.reduce((s, r) => s + (r?.sizeBytes || 0), 0);
  const anyRendering = allRenders.some(
    (r) =>
      (r.status === "rendering" || r.status === "queued") &&
      target.some((c) => c.id === r.clipId) &&
      r.quality === q
  );

  const mainLabel = selectMode
    ? allReady
      ? `Download ZIP (${target.length}) · ${fmtBytes(totalBytes)}`
      : `Render ${tierLabel(q)} · ${target.length} selected`
    : allReady
      ? `Download ZIP · ${fmtBytes(totalBytes)}`
      : `Render ${tierLabel(q)} · all ${clips.length}`;

  const onMain = () => {
    if (allReady) {
      downloadZip(readyRenders.filter(Boolean).map((r) => r!.id));
      toast(`Downloading ZIP · ${fmtBytes(totalBytes)} (real size)`);
      return;
    }
    const missing = target
      .filter((c) => !allRenders.some((r) => r.clipId === c.id && r.quality === q && r.status === "ready"))
      .map((c) => c.id);
    if (!missing.length) return;
    void startRender(missing, q).then((ok) => {
      if (ok) toast(`Rendering ${tierLabel(q)} for ${missing.length} clip${missing.length > 1 ? "s" : ""}…`);
      else toast("Could not start render");
    });
  };

  const onDeleteSelected = () => {
    const ids = [...selected];
    if (!ids.length) {
      toast("Nothing selected");
      return;
    }
    void deleteClips(ids);
    setSelectMode(false);
    toast(`Deleted ${ids.length} clip${ids.length > 1 ? "s" : ""}`);
  };

  return (
    <>
      <motion.div variants={stagger} initial="hidden" animate="show">
        <motion.h1 variants={item}>
          {clips.length} clip{clips.length > 1 ? "s" : ""} ready
        </motion.h1>
        <motion.p className="sub" variants={item}>
          Preview, then choose a quality below.
        </motion.p>
        {clips.map((c, i) => (
          <ClipCard key={c.id} clip={c} index={i} color={clipColor(i)} />
        ))}
      </motion.div>

      <div className="dock">
        <motion.div variants={dockIn} initial="hidden" animate="show">
          <div className="q">
            {ladder.map((t) => (
              <button
                key={t.key}
                className={q === t.key ? "chip on" : "chip"}
                onClick={() => setQuality(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="dockrow">
            <button
              className={selectMode ? "ib on" : "ib"}
              aria-label="Select clips"
              title="Select clips"
              onClick={() => setSelectMode(!selectMode)}
            >
              {selectMode ? <X className="lucide" /> : <CheckSquare className="lucide" />}
            </button>
            {selectMode ? (
              <button className="ib" aria-label="Delete selected" title="Delete selected" onClick={onDeleteSelected}>
                <Trash2 className="lucide" style={{ color: "#e5484d" }} />
              </button>
            ) : null}
            <button className="btn" onClick={onMain} disabled={!target.length}>
              {anyRendering ? <Loader2 className="lucide spin" /> : <Archive className="lucide" />}
              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{mainLabel}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
}
