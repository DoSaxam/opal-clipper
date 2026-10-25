import { create } from "zustand";
import type {
  AppStateResponse,
  Clip,
  HistoryEntry,
  RenderJob,
  TunnelStatus,
  VideoInfo,
} from "./types";
import { defaultQuality, ladderFor } from "./qualities";

/**
 * Global client store.
 *
 * Flow is a 4-step wizard (like the Opal Clipper design):
 *   0 Home (paste link) -> 1 Cut (timestamps) -> 2 Progress -> 3 Clips ready
 *
 * - Server state mirror (poll) — the server is TEMPORARY and forgets everything.
 * - Clip HISTORY lives ONLY in this browser (localStorage) — it survives server
 *   restarts and is never sent anywhere.
 * - Downloads are MANUAL ONLY: single clip, selected, or bulk-all. Nothing ever
 *   auto-downloads.
 */

export type Step = 0 | 1 | 2 | 3;

interface LocalStats {
  clipsCut: number;
  downloads: number;
  savedSeconds: number;
}

interface OpalState {
  // server state (temporary mirror)
  videos: VideoInfo[];
  clips: Clip[];
  renders: RenderJob[];
  tunnel: TunnelStatus | null;
  queue: { queued: number; active: number };
  loaded: boolean;

  // browser-local clip history (survives server restarts)
  history: HistoryEntry[];

  // wizard flow
  step: Step;
  activeVideoId: string | null;
  tsDraft: string;
  quality: string; // current chip (API key)
  selectMode: boolean;
  selected: Set<string>;

  // analyze flow
  analyzing: boolean;
  analyzeError: string | null;
  lastVideo: VideoInfo | null;

  // local stats
  stats: LocalStats;

  // actions
  go: (s: Step) => void;
  home: () => void;
  openVideo: (videoId: string, step?: Step) => void;
  setTsDraft: (v: string) => void;
  setQuality: (q: string) => void;
  setSelectMode: (on: boolean) => void;
  toggleSelect: (id: string) => void;
  clearSelection: () => void;
  analyze: (url: string) => Promise<boolean>;
  createClips: (videoId: string, ranges: { start: number; end: number }[]) => Promise<Clip[] | null>;
  startRender: (clipIds: string[], quality: string) => Promise<RenderJob[] | null>;
  deleteClips: (ids: string[]) => Promise<void>;
  refresh: () => Promise<void>;
  bumpStats: (patch: Partial<LocalStats>) => void;

  // history actions (browser-local)
  clearHistory: () => void;

  // manual downloads (the ONLY download triggers in the app)
  downloadRender: (renderId: string) => void;
  downloadZip: (renderIds: string[]) => void;
}

const STATS_KEY = "opal-clipper-stats";
const HISTORY_KEY = "opal-clipper-history-v1";
const HISTORY_CAP = 300;

function loadStats(): LocalStats {
  if (typeof window === "undefined") return { clipsCut: 0, downloads: 0, savedSeconds: 0 };
  try {
    return { clipsCut: 0, downloads: 0, savedSeconds: 0, ...JSON.parse(localStorage.getItem(STATS_KEY) || "{}") };
  } catch {
    return { clipsCut: 0, downloads: 0, savedSeconds: 0 };
  }
}

function saveStats(s: LocalStats) {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(raw) ? (raw as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, HISTORY_CAP)));
  } catch {
    /* ignore */
  }
}

function triggerBrowserDownload(url: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = "";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** Merge live server clips into the browser-local history (called on every poll). */
function syncHistory(entries: HistoryEntry[], serverClips: Clip[], serverVideos: VideoInfo[]): HistoryEntry[] {
  let next = [...entries];
  const liveIds = new Set(serverClips.map((c) => c.id));

  for (const c of serverClips) {
    const v = serverVideos.find((x) => x.id === c.videoId);
    const meta = v
      ? { title: v.title, uploader: v.uploader, thumbnail: v.thumbnail, sourceUrl: v.sourceUrl }
      : {};
    const i = next.findIndex((h) => h.id === c.id);
    if (i >= 0) {
      next[i] = { ...next[i], ...meta, start: c.start, end: c.end, createdAt: c.createdAt, status: "live" };
    } else {
      next.unshift({
        id: c.id,
        videoId: c.videoId,
        title: v?.title || "Video",
        uploader: v?.uploader || "",
        thumbnail: v?.thumbnail || "",
        sourceUrl: v?.sourceUrl || "",
        start: c.start,
        end: c.end,
        createdAt: c.createdAt,
        status: "live",
        ...meta,
      });
    }
  }

  // server no longer has it (restart / TTL / deleted elsewhere) -> expired, but
  // the record stays in the user's browser
  next = next.map((h) =>
    h.status === "live" && !liveIds.has(h.id) ? { ...h, status: "expired" as const } : h
  );

  next.sort((a, b) => b.createdAt - a.createdAt);
  next = next.slice(0, HISTORY_CAP);
  saveHistory(next);
  return next;
}

let pollTimer: ReturnType<typeof setTimeout> | null = null;

export const useOpal = create<OpalState>((set, get) => ({
  videos: [],
  clips: [],
  renders: [],
  tunnel: null,
  queue: { queued: 0, active: 0 },
  loaded: false,
  history: loadHistory(),

  step: 0,
  activeVideoId: null,
  tsDraft: "",
  quality: "1080",
  selectMode: false,
  selected: new Set(),
  analyzing: false,
  analyzeError: null,
  lastVideo: null,
  stats: loadStats(),

  go: (s) => set({ step: s, selectMode: false, selected: new Set() }),
  home: () => set({ step: 0, selectMode: false, selected: new Set() }),
  openVideo: (videoId, step = 3) => {
    const video = get().videos.find((v) => v.id === videoId) ?? null;
    const ladderKeys = ladderFor(video).map((q) => q.key);
    const quality = ladderKeys.includes(get().quality) ? get().quality : defaultQuality(video);
    set({ activeVideoId: videoId, step, quality, selectMode: false, selected: new Set() });
  },
  setTsDraft: (v) => set({ tsDraft: v }),
  setQuality: (q) => set({ quality: q }),
  setSelectMode: (on) => set({ selectMode: on, selected: on ? get().selected : new Set() }),
  toggleSelect: (id) => {
    const sel = new Set(get().selected);
    if (sel.has(id)) sel.delete(id);
    else sel.add(id);
    set({ selected: sel });
  },
  clearSelection: () => set({ selected: new Set(), selectMode: false }),

  bumpStats: (patch) => {
    const s = { ...get().stats, ...patch };
    saveStats(s);
    set({ stats: s });
  },

  clearHistory: () => {
    saveHistory([]);
    set({ history: [] });
  },

  analyze: async (url) => {
    set({ analyzing: true, analyzeError: null });
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) {
        set({ analyzing: false, analyzeError: data.error || "Could not analyze this link." });
        return false;
      }
      const video = data.video as VideoInfo;
      set({
        analyzing: false,
        analyzeError: null,
        lastVideo: video,
        activeVideoId: video.id,
        step: 1,
        tsDraft: "",
        quality: defaultQuality(video),
        selectMode: false,
        selected: new Set(),
      });
      void get().refresh();
      return true;
    } catch {
      set({ analyzing: false, analyzeError: "Network error — is the server awake?" });
      return false;
    }
  },

  createClips: async (videoId, ranges) => {
    try {
      const res = await fetch("/api/clips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId, ranges }),
      });
      const data = await res.json();
      if (!res.ok) return null;
      const clips = data.clips as Clip[];
      const newSeconds = ranges.reduce((acc, r) => acc + (r.end - r.start), 0);
      get().bumpStats({ clipsCut: get().stats.clipsCut + ranges.length, savedSeconds: get().stats.savedSeconds + newSeconds });

      // record in browser-local history immediately (video meta snapshot)
      const v = get().videos.find((x) => x.id === videoId) || get().lastVideo;
      const hist = [...get().history];
      for (const c of clips) {
        if (!hist.some((h) => h.id === c.id)) {
          hist.unshift({
            id: c.id,
            videoId: c.videoId,
            title: v?.title || "Video",
            uploader: v?.uploader || "",
            thumbnail: v?.thumbnail || "",
            sourceUrl: v?.sourceUrl || "",
            start: c.start,
            end: c.end,
            createdAt: c.createdAt,
            status: "live",
          });
        }
      }
      hist.sort((a, b) => b.createdAt - a.createdAt);
      saveHistory(hist.slice(0, HISTORY_CAP));

      set({
        step: 2,
        selectMode: false,
        selected: new Set(),
        history: hist.slice(0, HISTORY_CAP),
      });
      void get().refresh();
      return clips;
    } catch {
      return null;
    }
  },

  startRender: async (clipIds, quality) => {
    try {
      const res = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clipIds, quality }),
      });
      const data = await res.json();
      if (!res.ok) return null;
      void get().refresh();
      return data.renders as RenderJob[];
    } catch {
      return null;
    }
  },

  deleteClips: async (ids) => {
    try {
      await fetch("/api/clips/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      // deleting a clip also removes it from the browser history (user intent)
      const hist = get().history.filter((h) => !ids.includes(h.id));
      saveHistory(hist);
      const sel = new Set(get().selected);
      ids.forEach((i) => sel.delete(i));
      set({ selected: sel, history: hist });
      void get().refresh();
    } catch {
      /* ignore */
    }
  },

  // ---- MANUAL DOWNLOADS ONLY (no auto-download anywhere) ----

  downloadRender: (renderId) => {
    const r = get().renders.find((x) => x.id === renderId);
    if (!r || r.status !== "ready") return;
    triggerBrowserDownload(`/api/render/${r.id}/file`);
    get().bumpStats({ downloads: get().stats.downloads + 1 });
    // stamp the browser-local history with what was downloaded + its REAL size
    const hist = get().history.map((h) =>
      h.id === r.clipId
        ? { ...h, lastQuality: r.quality, lastSizeBytes: r.sizeBytes, downloadedAt: Date.now() }
        : h
    );
    saveHistory(hist);
    set({ history: hist });
  },

  downloadZip: (renderIds) => {
    const ready = get().renders.filter((x) => renderIds.includes(x.id) && x.status === "ready");
    if (!ready.length) return;
    triggerBrowserDownload(`/api/zip?ids=${ready.map((r) => r.id).join(",")}`);
    get().bumpStats({ downloads: get().stats.downloads + ready.length });
    const hist = get().history.map((h) => {
      const r = ready.find((x) => x.clipId === h.id);
      return r
        ? { ...h, lastQuality: r.quality, lastSizeBytes: r.sizeBytes, downloadedAt: Date.now() }
        : h;
    });
    saveHistory(hist);
    set({ history: hist });
  },

  refresh: async () => {
    try {
      const res = await fetch("/api/state");
      if (!res.ok) return;
      const data = (await res.json()) as AppStateResponse;
      set({
        videos: data.videos,
        clips: data.clips,
        renders: data.renders,
        tunnel: data.tunnel,
        queue: data.queue,
        loaded: true,
      });
      // keep browser history in sync with what the (temporary) server still has
      const merged = syncHistory(get().history, data.clips, data.videos);
      set({ history: merged });
    } catch {
      /* offline tick */
    }
  },
}));

/** Adaptive polling: fast while jobs are active, slow when idle. Call once from the shell. */
export function startPolling() {
  if (pollTimer) return;
  const tick = async () => {
    const s = useOpal.getState();
    const active =
      s.clips.some((c) => c.status === "queued" || c.status === "cutting") ||
      s.renders.some((r) => r.status === "queued" || r.status === "rendering");
    const analyzing = s.analyzing;
    await s.refresh();
    const next = active || analyzing ? 1500 : 5000;
    pollTimer = setTimeout(tick, next);
  };
  void tick();
}
