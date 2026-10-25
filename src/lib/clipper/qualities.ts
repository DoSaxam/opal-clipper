// Quality ladder + clip color palette (shared by all screens)
import type { VideoInfo } from "./types";

export interface QualityTier {
  key: string; // API value ("360" … "2160" | "mp3")
  label: string; // chip label
  h: number; // source height needed (0 for audio)
}

export const QUALITY_LADDER: QualityTier[] = [
  { key: "360", label: "360p", h: 360 },
  { key: "480", label: "480p", h: 480 },
  { key: "720", label: "720p", h: 720 },
  { key: "1080", label: "1080p", h: 1080 },
  { key: "1440", label: "1440p", h: 1440 },
  { key: "2160", label: "4K", h: 2160 },
  { key: "mp3", label: "MP3", h: 0 },
];

/** Source-aware ladder: never offer a quality above the video's best height. */
export function ladderFor(video?: VideoInfo | null): QualityTier[] {
  const best = video?.heights?.[0] ?? 0;
  if (!best) return QUALITY_LADDER.filter((q) => q.key === "mp3" || q.h <= 1080);
  return QUALITY_LADDER.filter((q) => q.key === "mp3" || q.h <= best);
}

export function tierLabel(key: string): string {
  return QUALITY_LADDER.find((q) => q.key === key)?.label ?? key;
}

/** Short label for the video's best available quality ("4K", "1080p"…). */
export function bestLabel(video?: VideoInfo | null): string {
  const best = video?.heights?.[0] ?? 0;
  if (!best) return "SD";
  if (best >= 2160) return "4K";
  if (best >= 1440) return "1440p";
  if (best >= 1080) return "1080p";
  if (best >= 720) return "720p";
  if (best >= 480) return "480p";
  return `${best}p`;
}

/** Default chip: 1080p when the source allows it (fast + sharp), else best. */
export function defaultQuality(video?: VideoInfo | null): string {
  const videoTiers = ladderFor(video).filter((q) => q.key !== "mp3");
  if (!videoTiers.length) return "mp3";
  return videoTiers.some((q) => q.key === "1080") ? "1080" : videoTiers[videoTiers.length - 1].key;
}

export const CLIP_COLORS = ["#ff5a2e", "#3b82f6", "#10b981", "#f59e0b", "#a855f7", "#ec4899"];
export const clipColor = (i: number) => CLIP_COLORS[i % CLIP_COLORS.length];
