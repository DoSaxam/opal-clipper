"use client";

import { useState } from "react";
import { Drawer } from "vaul";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { TapButton } from "./TapButton";
import { AudioGlyph, DownloadGlyph, GaugeGlyph } from "./icons";
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
        <Drawer.Overlay className="fixed inset-0 z-40" style={{ background: "rgba(4,6,5,0.65)", backdropFilter: "blur(3px)" }} />
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 z-50 mx-auto outline-none"
          style={{
            maxWidth: 430,
            borderRadius: "42px 42px 0 0",
            background:
              "radial-gradient(120% 90% at 8% 0%, rgba(28,36,33,1) 0%, rgba(16,18,17,1) 46%, rgba(13,15,14,1) 100%)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.07), 0 -20px 60px rgba(0,0,0,0.6)",
          }}
        >
          <div className="mx-auto mt-3 w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.18)" }} />
          <div className="px-5 pt-4 pb-8">
            <div className="flex items-center gap-3">
              <div
                className="grid place-items-center"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 13,
                  background: "rgba(183,247,230,0.08)",
                  boxShadow: "inset 0 0 0 1px rgba(183,247,230,0.25)",
                }}
              >
                <GaugeGlyph style={{ width: 19, height: 19 }} />
              </div>
              <div>
                <Drawer.Title className="text-[16px]" style={{ color: "#ffffff", fontWeight: 510, letterSpacing: "-0.012em" }}>
                  Choose quality
                </Drawer.Title>
                <Drawer.Description className="mono-meta text-[10.5px] mt-0.5" style={{ color: "#9db0a8" }}>
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
                    className="opal-chip w-full flex items-center gap-3.5 px-4 text-left"
                    style={{ borderRadius: 20, padding: "13px 16px", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)" }}
                  >
                    {o.value === "mp3" ? (
                      <AudioGlyph style={{ width: 16, height: 16, color: "#9db0a8", flex: "none" }} />
                    ) : (
                      <DownloadGlyph style={{ width: 15, height: 15, flex: "none" }} />
                    )}
                    <div className="min-w-0">
                      <div className="mono-meta text-[14px]" style={{ color: "#ffffff" }}>
                        {o.label}
                      </div>
                      <div className="text-[10.5px]" style={{ color: "#9db0a8" }}>
                        {o.sub}
                      </div>
                    </div>
                    <span className="flex-1" />
                    {busy ? (
                      <Loader2 size={15} className="animate-spin" style={{ color: "#CDFCE2" }} />
                    ) : (
                      <span className="text-[12px]" style={{ color: "#CDFCE2", fontWeight: 510 }}>
                        {count > 1 ? `Render ${count}` : "Render"}
                      </span>
                    )}
                  </TapButton>
                </motion.div>
              ))}
            </div>

            <p className="mt-4 text-center mono-meta text-[10px] leading-relaxed px-4" style={{ color: "#9db0a8" }}>
              PREVIEW 720P · DOWNLOAD CRISP {bestLabel.toUpperCase()} TAK RENDER HOTA HAI
            </p>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
