import fs from "fs";
import path from "path";
import { CLIPS_DIR, STATE_FILE, STORAGE_DIR, VIDEOS_DIR, clipDir, videoDir } from "./paths";

/**
 * Persistent app state (videos, clips, render jobs).
 * Survives dev-server hot reloads & restarts: written through to state.json,
 * in-flight jobs are recovered (marked ready if their files exist).
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
    saveTimer?: NodeJS.Timeout;
  };
}

const g = globalThis as unknown as StoreGlobal;

function emptyState(): AppState {
  return { videos: [], clips: [], renders: [] };
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
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
      fs.mkdirSync(VIDEOS_DIR, { recursive: true });
      fs.mkdirSync(CLIPS_DIR, { recursive: true });
      if (fs.existsSync(STATE_FILE)) {
        const raw = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8")) as AppState;
        s.state = { ...emptyState(), ...raw };
      }
      recoverInterrupted(s.state);
    } catch {
      s.state = emptyState();
    }
  }
  return s;
}

/** Mark in-flight jobs from a previous process; keep files that already exist. */
function recoverInterrupted(state: AppState) {
  for (const clip of state.clips) {
    const dir = clipDir(clip.id);
    clip.hasPreview = fs.existsSync(path.join(dir, "preview.mp4"));
    clip.hasPoster = fs.existsSync(path.join(dir, "poster.jpg"));
    // recompute rendered qualities from disk
    clip.renderedQualities = [];
    try {
      for (const f of fs.readdirSync(dir)) {
        const m = f.match(/^q_(.+)\.(mp4|mp3)$/);
        if (m) clip.renderedQualities.push(m[1]);
      }
    } catch {
      /* dir missing */
    }
    if (clip.status === "queued" || clip.status === "cutting") {
      if (clip.hasPreview) {
        clip.status = "ready";
        clip.progress = 100;
        clip.stage = "Ready";
      } else {
        clip.status = "error";
        clip.error = "Interrupted. Please retry.";
        clip.stage = "Error";
      }
    }
  }
  for (const r of state.renders) {
    const clip = state.clips.find((c) => c.id === r.clipId);
    const fileOk =
      clip &&
      fs.existsSync(path.join(clipDir(clip.id), `q_${r.quality}.${r.quality === "mp3" ? "mp3" : "mp4"}`));
    if (r.status === "queued" || r.status === "rendering") {
      if (fileOk) {
        r.status = "ready";
        r.progress = 100;
      } else {
        r.status = "error";
        r.error = "Interrupted. Please retry.";
      }
    }
  }
  state.renders = state.renders.filter((r) => state.clips.some((c) => c.id === r.clipId));
}

export function persist() {
  const s = ensureStore();
  if (s.saveTimer) clearTimeout(s.saveTimer);
  s.saveTimer = setTimeout(() => {
    try {
      const tmp = STATE_FILE + ".tmp";
      fs.writeFileSync(tmp, JSON.stringify(s.state));
      fs.renameSync(tmp, STATE_FILE);
    } catch (e) {
      console.error("[store] persist failed", e);
    }
  }, 250);
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
