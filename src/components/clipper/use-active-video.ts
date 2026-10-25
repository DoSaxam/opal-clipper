"use client";

import { useOpal } from "@/lib/clipper/store";
import type { VideoInfo } from "@/lib/clipper/types";

/**
 * The video the wizard is currently working on.
 * Returns a STABLE reference (zustand-safe): the object comes straight from
 * state, so it never changes identity between polls.
 */
export function useActiveVideo(): VideoInfo | null {
  return useOpal((s) => {
    const fromStore = s.videos.find((v) => v.id === s.activeVideoId);
    if (fromStore) return fromStore;
    if (s.lastVideo && s.lastVideo.id === s.activeVideoId) return s.lastVideo;
    return null;
  });
}
