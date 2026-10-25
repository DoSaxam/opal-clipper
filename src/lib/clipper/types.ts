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
  /** REAL size of preview.mp4 on disk (bytes) — shown in the embedded preview. */
  previewBytes?: number;
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
  /** REAL size of the rendered file on disk (bytes). */
  sizeBytes?: number;
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

/**
 * Browser-local clip history entry. The server is temporary — this record is
 * the ONLY thing that persists (in the user's own browser via localStorage).
 */
export type HistoryStatus = "live" | "expired";

export interface HistoryEntry {
  id: string; // clip id
  videoId: string;
  title: string;
  uploader: string;
  thumbnail: string;
  sourceUrl: string;
  start: number;
  end: number;
  createdAt: number;
  status: HistoryStatus;
  /** last downloaded quality + its REAL size (set when the user downloads) */
  lastQuality?: string;
  lastSizeBytes?: number;
  downloadedAt?: number;
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

/** REAL byte size → human text ("12.4 MB", "1.42 GB"). "—" when unknown. */
export function fmtBytes(n?: number): string {
  if (n == null || !Number.isFinite(n) || n <= 0) return "—";
  if (n < 1024) return `${n} B`;
  const kb = n / 1024;
  if (kb < 1024) return `${kb.toFixed(kb < 100 ? 1 : 0)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(mb < 100 ? 1 : 0)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(2)} GB`;
}

/** Date label for history rows (e.g. "Oct 25, 01:24"). */
export function fmtDate(ts: number): string {
  try {
    return new Date(ts).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}
