"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Download, FileAudio, Gauge, Loader2, Sparkles } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useOpal } from "@/lib/clipper/store";
import type { Clip } from "@/lib/clipper/types";
import { cn } from "@/lib/utils";

export interface QualityDrawerProps {
  open: boolean;
  onClose: () => void;
  clip?: Clip;
  bulkIds?: string[];
  onStarted?: (renderIds: string[], quality: string) => void;
}

export function QualityDrawer({
  open,
  onClose,
  clip,
  bulkIds,
  onStarted,
}: QualityDrawerProps) {
  const { videos, clips, startRender } = useOpal();
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);

  const videoId =
    clip?.videoId ??
    (bulkIds?.length ? clips.find((c) => c.id === bulkIds[0])?.videoId : undefined);
  const video = videos.find((v) => v.id === videoId);

  const heights = (video?.heights || [])
    .filter((h) => h >= 360)
    .sort((a, b) => b - a);
  const tier = (h: number) =>
    h >= 2160
      ? "4K Ultra HD"
      : h >= 1440
        ? "2K Quad HD"
        : h >= 1080
          ? "Full HD"
          : h >= 720
            ? "HD"
            : "SD";

  const options: { value: string; label: string; sub: string }[] = [
    ...heights.map((h, i) => ({
      value: String(h),
      label: h >= 2160 ? `4K · ${h}p` : h >= 1440 ? `2K · ${h}p` : `${h}p`,
      sub: i === 0 ? `${tier(h)} · best` : tier(h),
    })),
    { value: "mp3", label: "MP3", sub: "Audio only" },
  ];

  const count = bulkIds?.length || (clip ? 1 : 0);

  const onPick = async (quality: string) => {
    if (busy) return;
    setBusy(true);
    const ids = bulkIds && bulkIds.length ? bulkIds : clip ? [clip.id] : [];
    const renders = await startRender(ids, quality);
    setBusy(false);
    if (renders) onStarted?.(renders.map((r) => r.id), quality);
    onClose();
  };

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-primary/12">
              <Gauge className="size-4 text-primary" />
            </span>
            <div>
              <DrawerTitle>Choose quality</DrawerTitle>
              <DrawerDescription>
                {count > 1
                  ? `${count} clips — rendered one by one, then zipped`
                  : "Frame-accurate render at the best available source"}
              </DrawerDescription>
            </div>
          </div>
        </DrawerHeader>

        <div className="opal-scroll flex max-h-[46dvh] flex-col gap-2 overflow-y-auto px-5 pb-2">
          {options.map((o, i) => {
            const active = picked === o.value;
            return (
              <motion.button
                key={o.value}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setPicked(o.value)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition-colors",
                  active
                    ? "border border-primary/45 bg-primary/10"
                    : "surface-sunken hover:border-primary/25"
                )}
              >
                {o.value === "mp3" ? (
                  <FileAudio className="size-4 shrink-0 text-[#f6e05e]" />
                ) : (
                  <Download className="size-4 shrink-0 text-primary" />
                )}
                <span className="text-[15px] font-bold text-foreground">{o.label}</span>
                <span className="text-[11.5px] font-medium text-muted-foreground">
                  {o.sub}
                </span>
                {active && (
                  <Badge variant="default" size="sm" className="ml-auto">
                    <Sparkles className="size-3" />
                    selected
                  </Badge>
                )}
              </motion.button>
            );
          })}
        </div>

        <DrawerFooter>
          <Button
            onClick={() => picked && void onPick(picked)}
            disabled={!picked || busy}
            className="h-[52px] w-full gap-2 rounded-2xl text-[15.5px]"
          >
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Starting render…
              </>
            ) : picked ? (
              <>
                <Download className="size-4" />
                Render {count > 1 ? `${count} clips` : "clip"} at{" "}
                {picked === "mp3" ? "MP3" : `${picked}p`}
              </>
            ) : (
              "Pick a quality"
            )}
          </Button>
          <p className="pb-1 text-center text-[11px] leading-relaxed text-muted-foreground">
            Preview plays at 720p; the download is rendered crisp at the quality
            you pick.
          </p>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
