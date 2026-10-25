import fs from "fs";
import path from "path";
import { CLIPS_DIR, VIDEOS_DIR, clipDir, videoDir } from "./paths";

/**
 * TEMPORARY app state (videos, clips, render jobs).
 *
 * Nothing is persisted to disk — the server keeps state in memory for the
 * lifetime of the process only. On every fresh boot the clips/ and videos/
 * storage directories are wiped, so rendered media is strictly ephemeral.
 * The user's clip HISTORY lives exclusively in their browser (localStorage),
 * hydrated client-side — the server never remembers anything between runs.
 */

export interface VideoInfo {
  id: string; // stable key: extractor:videoId
  sourceUrl: string;
  extractor: string;
  title: string;
  uploader: string;
  duration: number; // seconds
  thumbnail: string;
  heights: number[]; // available video heights desc
  createdAt: number;
}

export type ClipStatus = "queued" | "cutting" | "ready" | "error";

/** How the clip's audio relates to the source video's own track. */
export type AudioMode = "original" | "reencoded" | "none";

export interface Clip {
  id: string;
  videoId: string;
  start: number;
  end: number;
  status: ClipStatus;
  progress: number; // 0-100
  stage: string; // human label
  error?: string;
  createdAt: number;
  hasPreview: boolean;
  hasPoster: boolean;
  renderedQualities: string[];
  /** audio of preview.mp4: "original" = bit-for-bit the source video's own track */
  audioMode?: AudioMode;
  /** e.g. "AAC 128k" — the audio actually inside the file */
  audioLabel?: string;
}

export type RenderStatus = "queued" | "rendering" | "ready" | "error";

export interface RenderJob {
  id: string;
  clipId: string;
  quality: string; // "1080" | "720" | ... | "mp3"
  status: RenderStatus;
  progress: number;
  error?: string;
  fileName?: string;
  createdAt: number;
  /** audio of the rendered file (undefined for MP3 exports — those are audio-only) */
  audioMode?: AudioMode;
  audioLabel?: string;
}

export interface AppState {
  videos: VideoInfo[];
  clips: Clip[];
  renders: RenderJob[];
}

interface StoreGlobal {
  __opalStore?: {
    state: AppState;
    loaded: boolean;
  };
}

const g = globalThis as unknown as StoreGlobal;

function emptyState(): AppState {
  return { videos: [], clips: [], renders: [] };
}

/** Boot-time wipe: media on this server is TEMPORARY — a fresh process starts clean. */
function wipeStorageForFreshBoot() {
  for (const dir of [CLIPS_DIR, VIDEOS_DIR]) {
    try {
      if (fs.existsSync(dir)) {
        for (const entry of fs.readdirSync(dir)) {
          fs.rmSync(path.join(dir, entry), { recursive: true, force: true });
        }
      }
    } catch {
      /* best effort */
    }
  }
}

export function getStore(): AppState {
  const s = ensureStore();
  return s.state;
}

function ensureStore() {
  if (!g.__opalStore) {
    g.__opalStore = { state: emptyState(), loaded: false };
  }
  const s = g.__opalStore!;
  if (!s.loaded) {
    s.loaded = true;
    try {
      fs.mkdirSync(CLIPS_DIR, { recursive: true });
      fs.mkdirSync(VIDEOS_DIR, { recursive: true });
      wipeStorageForFreshBoot(); // temporary server: fresh boot = clean slate
    } catch {
      s.state = emptyState();
    }
  }
  return s;
}

/** No-op — state is deliberately TEMPORARY (in-memory only, never written to disk). */
export function persist() {
  /* intentionally empty: nothing persists server-side */
}

export function upsertVideo(video: VideoInfo) {
  const s = ensureStore();
  const idx = s.state.videos.findIndex((v) => v.id === video.id);
  if (idx >= 0) s.state.videos[idx] = video;
  else s.state.videos.unshift(video);
  if (s.state.videos.length > 30) s.state.videos.length = 30;
  persist();
  return video;
}

export function getVideo(videoId: string): VideoInfo | undefined {
  return ensureStore().state.videos.find((v) => v.id === videoId);
}

export function addClip(clip: Clip) {
  const s = ensureStore();
  s.state.clips.unshift(clip);
  persist();
}

export function updateClip(id: string, patch: Partial<Clip>) {
  const s = ensureStore();
  const c = s.state.clips.find((x) => x.id === id);
  if (!c) return;
  Object.assign(c, patch);
  persist();
}

export function getClip(id: string): Clip | undefined {
  return ensureStore().state.clips.find((c) => c.id === id);
}

export function deleteClips(ids: string[]) {
  const s = ensureStore();
  for (const id of ids) {
    const dir = clipDir(id);
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
  s.state.clips = s.state.clips.filter((c) => !ids.includes(c.id));
  s.state.renders = s.state.renders.filter((r) => !ids.includes(r.clipId));
  // drop videos that no longer have any clips (and their cached formats)
  const liveVideoIds = new Set(s.state.clips.map((c) => c.videoId));
  const orphans = s.state.videos.filter((v) => !liveVideoIds.has(v.id));
  for (const v of orphans) {
    try {
      fs.rmSync(videoDir(v.id), { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
  if (orphans.length) s.state.videos = s.state.videos.filter((v) => liveVideoIds.has(v.id));
  persist();
}

export function addRender(r: RenderJob) {
  const s = ensureStore();
  // dedupe: reuse an existing ready render for same clip+quality
  const existing = s.state.renders.find(
    (x) => x.clipId === r.clipId && x.quality === r.quality && x.status === "ready"
  );
  if (existing) return existing;
  s.state.renders.unshift(r);
  persist();
  return r;
}

export function updateRender(id: string, patch: Partial<RenderJob>) {
  const s = ensureStore();
  const r = s.state.renders.find((x) => x.id === id);
  if (!r) return;
  Object.assign(r, patch);
  persist();
}

export function getRender(id: string): RenderJob | undefined {
  return ensureStore().state.renders.find((r) => r.id === id);
}
