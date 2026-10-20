// Shared client-side types (mirror of server state)

export interface VideoInfo {
  id: string;
  sourceUrl: string;
  extractor: string;
  title: string;
  uploader: string;
  duration: number;
  thumbnail: string;
  heights: number[];
  createdAt: number;
}

export type ClipStatus = "queued" | "cutting" | "ready" | "error";

export interface Clip {
  id: string;
  videoId: string;
  start: number;
  end: number;
  status: ClipStatus;
  progress: number;
  stage: string;
  error?: string;
  createdAt: number;
  hasPreview: boolean;
  hasPoster: boolean;
  renderedQualities: string[];
}

export type RenderStatus = "queued" | "rendering" | "ready" | "error";

export interface RenderJob {
  id: string;
  clipId: string;
  quality: string;
  status: RenderStatus;
  progress: number;
  error?: string;
  fileName?: string;
  createdAt: number;
}

export interface TunnelStatus {
  socksUp: boolean;
  httpProxyUp: boolean;
  mediaProxyUp: boolean;
  warpOn: boolean;
  egressIp?: string;
  error?: string;
}

export interface AppStateResponse {
  videos: VideoInfo[];
  clips: Clip[];
  renders: RenderJob[];
  queue: { queued: number; active: number };
  tunnel: TunnelStatus;
}

export function fmtClock(sec: number): string {
  const s = Math.floor(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  return `${m}:${String(ss).padStart(2, "0")}`;
}

export function fmtDur(sec: number): string {
  if (sec < 60) return `${Math.round(sec)}s`;
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return s ? `${m}m ${s}s` : `${m}m`;
}
