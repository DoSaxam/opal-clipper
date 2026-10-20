"use client";

import { useState } from "react";
import { Drawer } from "vaul";
import { motion } from "framer-motion";
import { Download, FileAudio, Gauge, Loader2 } from "lucide-react";
import { TapButton } from "./TapButton";
import { useOpal } from "@/lib/clipper/store";
import type { Clip } from "@/lib/clipper/types";

export interface QualitySheetProps {
  open: boolean;
  onClose: () => void;
  clip?: Clip; // single mode
  bulkIds?: string[]; // bulk mode
  onStarted?: (renderIds: string[], quality: string) => void; // bulk ZIP flow hook
}

export function QualitySheet({ open, onClose, clip, bulkIds, onStarted }: QualitySheetProps) {
  const { videos, clips, startRender } = useOpal();
  const [busy, setBusy] = useState(false);
  const videoId = clip?.videoId ?? (bulkIds?.length ? clips.find((c) => c.id === bulkIds[0])?.videoId : undefined);
  const video = videos.find((v) => v.id === videoId);

  const heights = (video?.heights || []).filter((h) => h >= 360).sort((a, b) => b - a);
  const tier = (h: number) =>
    h >= 2160 ? "4K Ultra HD" : h >= 1440 ? "2K Quad HD" : h >= 1080 ? "Full HD" : h >= 720 ? "HD" : "SD";
  const options: { value: string; label: string; sub: string }[] = [
    ...heights.map((h, i) => ({
      value: String(h),
      label: h >= 2160 ? `4K · ${h}p` : h >= 1440 ? `2K · ${h}p` : `${h}p`,
      sub: i === 0 ? `${tier(h)} · Best` : tier(h),
    })),
    { value: "mp3", label: "MP3", sub: "Audio only" },
  ];
  const bestLabel = heights.length ? `${heights[0]}p` : "source";

  const onPick = async (quality: string) => {
    if (busy) return;
    setBusy(true);
    const ids = bulkIds && bulkIds.length ? bulkIds : clip ? [clip.id] : [];
    const renders = await startRender(ids, quality);
    setBusy(false);
    if (renders) onStarted?.(renders.map((r) => r.id), quality);
    onClose();
  };

  const count = bulkIds?.length || 1;

  return (
    <Drawer.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40" style={{ background: "rgba(4,5,6,0.65)", backdropFilter: "blur(3px)" }} />
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 z-50 mx-auto rounded-t-[16px] outline-none"
          style={{
            maxWidth: 430,
            background: "#111213",
            boxShadow: "#383B3F 0 1px 0 0 inset, rgba(0,0,0,0.6) 0 -20px 60px",
          }}
        >
          <div className="mx-auto mt-2.5 w-10 h-1 rounded-full bg-smoke/50" />
          <div className="px-5 pt-4 pb-8">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-[8px] grid place-items-center"
                style={{ background: "rgba(228,242,34,0.08)", boxShadow: "rgba(228,242,34,0.22) 0 0 0 1px inset" }}
              >
                <Gauge size={15} className="text-acid" />
              </div>
              <div>
                <Drawer.Title className="text-[16px] text-paper" style={{ fontWeight: 510, letterSpacing: "-0.012em" }}>
                  Choose quality
                </Drawer.Title>
                <Drawer.Description className="mono-meta text-[10.5px] text-ash mt-0.5">
                  {count > 1 ? `${count} CLIPS — ONE ZIP` : "FRAME-ACCURATE · BEST SOURCE"}
                </Drawer.Description>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-1.5">
              {options.map((o, i) => (
                <motion.div key={o.value} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <TapButton
                    onClick={() => void onPick(o.value)}
                    disabled={busy}
                    className="w-full flex items-center gap-3 rounded-[8px] px-4 py-3.5 transition-colors text-left"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      boxShadow: "#23252A 0 0 0 1px inset",
                    }}
                  >
                    {o.value === "mp3" ? (
                      <FileAudio size={16} className="text-fog shrink-0" />
                    ) : (
                      <Download size={15} className="text-acid shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="mono-meta text-[14px] text-paper">{o.label}</div>
                      <div className="text-[10.5px] text-ash">{o.sub}</div>
                    </div>
                    <span className="flex-1" />
                    {busy ? (
                      <Loader2 size={15} className="animate-spin text-acid" />
                    ) : (
                      <span className="text-[12px] text-acid" style={{ fontWeight: 510 }}>
                        {count > 1 ? `Render ${count}` : "Render"}
                      </span>
                    )}
                  </TapButton>
                </motion.div>
              ))}
            </div>

            <p className="mt-4 text-center mono-meta text-[10px] text-ash leading-relaxed px-4">
              PREVIEW 720P · DOWNLOAD CRISP {bestLabel.toUpperCase()} TAK RENDER HOTA HAI
            </p>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
