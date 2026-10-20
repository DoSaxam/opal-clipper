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
  // single mode: the clip's video; bulk mode: video of the first selected clip
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
        <Drawer.Overlay className="fixed inset-0 z-40" style={{ background: "rgba(4,5,6,0.6)", backdropFilter: "blur(3px)" }} />
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 z-50 mx-auto rounded-t-[28px] outline-none"
          style={{
            maxWidth: 430,
            background: "linear-gradient(175deg, #1A202C 0%, #131820 100%)",
            borderTop: "1px solid rgba(45,55,72,0.9)",
            boxShadow: "0 -20px 60px rgba(0,0,0,0.6)",
          }}
        >
          <div className="mx-auto mt-2.5 w-10 h-1 rounded-full bg-white/20" />
          <div className="px-6 pt-4 pb-8">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl grid place-items-center" style={{ background: "rgba(129,230,217,0.12)", border: "1px solid rgba(129,230,217,0.25)" }}>
                <Gauge size={16} className="text-[#81E6D9]" />
              </div>
              <div>
                <Drawer.Title className="text-[17px] font-bold text-white">Choose quality</Drawer.Title>
                <Drawer.Description className="text-[12px] text-[#A0AEC0]">
                  {count > 1 ? `${count} clips — rendered one-by-one, then a single ZIP` : "Frame-accurate render, best available source"}
                </Drawer.Description>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2">
              {options.map((o, i) => (
                <motion.div key={o.value} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <TapButton
                    onClick={() => void onPick(o.value)}
                    disabled={busy}
                    className="w-full flex items-center gap-3 rounded-2xl px-4 py-3.5"
                    style={{
                      background: o.value === "mp3" ? "rgba(246,224,94,0.06)" : "rgba(10,11,13,0.5)",
                      border: o.value === "mp3" ? "1px solid rgba(246,224,94,0.2)" : "1px solid rgba(45,55,72,0.8)",
                    }}
                  >
                    {o.value === "mp3" ? (
                      <FileAudio size={17} className="text-[#F6E05E]" />
                    ) : (
                      <Download size={16} className="text-[#81E6D9]" />
                    )}
                    <span className="text-[15px] font-bold text-white">{o.label}</span>
                    <span className="text-[11.5px] text-[#718096] font-medium">{o.sub}</span>
                    <span className="flex-1" />
                    {busy ? (
                      <Loader2 size={16} className="animate-spin text-[#81E6D9]" />
                    ) : (
                      <span className="text-[12px] font-semibold text-[#81E6D9]">
                        {count > 1 ? `Render ${count}` : "Render"}
                      </span>
                    )}
                  </TapButton>
                </motion.div>
              ))}
            </div>

            <p className="mt-4 text-center text-[11px] text-[#5A6478] leading-relaxed px-4">
              Preview 720p pe hota hai; download aapke chune hue quality me crisp {bestLabel} tak render hota hai.
            </p>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
