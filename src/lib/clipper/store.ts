import { create } from "zustand";
import type { AppStateResponse, Clip, RenderJob, TunnelStatus, VideoInfo } from "./types";

/**
 * Global client store: server state mirror (poll), local lifetime stats,
 * navigation (tab + pushed screen), and selection mode.
 */

export type TabKey = "home" | "clips" | "queue";
export type Screen =
  | { kind: "tabs" }
  | { kind: "video"; video: VideoInfo };

interface LocalStats {
  clipsCut: number;
  downloads: number;
  savedSeconds: number;
}

interface OpalState {
  // server state
  videos: VideoInfo[];
  clips: Clip[];
  renders: RenderJob[];
  tunnel: TunnelStatus | null;
  queue: { queued: number; active: number };
  loaded: boolean;

  // nav
  tab: TabKey;
  screen: Screen;
  selectMode: boolean;
  selected: Set<string>;

  // analyze flow
  analyzing: boolean;
  analyzeError: string | null;
  lastVideo: VideoInfo | null;

  // local stats
  stats: LocalStats;

  // actions
  setTab: (t: TabKey) => void;
  pushScreen: (s: Screen) => void;
  popScreen: () => void;
  setSelectMode: (on: boolean) => void;
  toggleSelect: (id: string) => void;
  clearSelection: () => void;
  analyze: (url: string) => Promise<boolean>;
  createClips: (videoId: string, ranges: { start: number; end: number }[]) => Promise<Clip[] | null>;
  startRender: (clipIds: string[], quality: string) => Promise<RenderJob[] | null>;
  deleteClips: (ids: string[]) => Promise<void>;
  refresh: () => Promise<void>;
  bumpStats: (patch: Partial<LocalStats>) => void;
  registerAutoDownload: (renderId: string) => void;
  downloadedRenderIds: Set<string>;
}

const STATS_KEY = "opal-clipper-stats";

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

let pollTimer: ReturnType<typeof setTimeout> | null = null;

export const useOpal = create<OpalState>((set, get) => ({
  videos: [],
  clips: [],
  renders: [],
  tunnel: null,
  queue: { queued: 0, active: 0 },
  loaded: false,
  tab: "home",
  screen: { kind: "tabs" },
  selectMode: false,
  selected: new Set(),
  analyzing: false,
  analyzeError: null,
  lastVideo: null,
  stats: { clipsCut: 0, downloads: 0, savedSeconds: 0 },
  downloadedRenderIds: new Set(),

  setTab: (t) => set({ tab: t, selectMode: false, selected: new Set() }),
  pushScreen: (s) => set({ screen: s }),
  popScreen: () => set({ screen: { kind: "tabs" } }),
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
      set({ analyzing: false, analyzeError: null, lastVideo: data.video });
      get().pushScreen({ kind: "video", video: data.video });
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
      const newSeconds = ranges.reduce((acc, r) => acc + (r.end - r.start), 0);
      get().bumpStats({ clipsCut: get().stats.clipsCut + ranges.length, savedSeconds: get().stats.savedSeconds + newSeconds });
      void get().refresh();
      return data.clips as Clip[];
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
      const sel = new Set(get().selected);
      ids.forEach((i) => sel.delete(i));
      set({ selected: sel });
      void get().refresh();
    } catch {
      /* ignore */
    }
  },

  registerAutoDownload: (renderId) => {
    const s = new Set(get().downloadedRenderIds);
    s.add(renderId);
    set({ downloadedRenderIds: s });
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
