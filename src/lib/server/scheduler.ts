import path from "path";
import { clipDir } from "./paths";
import { getFormats, refreshFormats } from "./ytdlp";
import { cutClip, makePoster, renderMp3, clipFilePath } from "./cutter";
import {
  getClip,
  getVideo,
  updateClip,
  updateRender,
  persist,
  type Clip,
  type RenderJob,
} from "./state";

/**
 * Background job scheduler: processes clip cuts & quality renders with bounded
 * concurrency. Jobs keep running server-side regardless of what the UI does.
 */

interface QueueGlobal {
  __opalQueue?: {
    queue: Array<() => Promise<void>>;
    active: number;
    maxConcurrent: number;
  };
}

const g = globalThis as unknown as QueueGlobal;
if (!g.__opalQueue) g.__opalQueue = { queue: [], active: 0, maxConcurrent: 2 };

function enqueue(task: () => Promise<void>) {
  const q = g.__opalQueue!;
  q.queue.push(task);
  pump();
}

function pump() {
  const q = g.__opalQueue!;
  while (q.active < q.maxConcurrent && q.queue.length > 0) {
    const task = q.queue.shift()!;
    q.active++;
    task()
      .catch((e) => console.error("[scheduler] job failed:", e?.message || e))
      .finally(() => {
        q.active--;
        pump();
      });
  }
}

/** Preview render height: min(720, best available) — sharp enough for card playback. */
function previewHeight(heights: number[]): number | null {
  if (!heights.length) return null;
  const best = heights[0];
  return Math.min(720, best);
}

export function enqueueClipCut(clip: Clip) {
  enqueue(async () => {
    const video = getVideo(clip.videoId);
    if (!video) {
      updateClip(clip.id, { status: "error", error: "Video info missing.", stage: "Error" });
      return;
    }
    try {
      updateClip(clip.id, { status: "cutting", stage: "Resolving streams", progress: 4 });
      let entry = await getFormats(clip.videoId, video.sourceUrl);
      const getFresh = () => refreshFormats(clip.videoId, video.sourceUrl);

      const dir = clipDir(clip.id);
      const previewPath = path.join(dir, "preview.mp4");
      const posterPath = path.join(dir, "poster.jpg");

      updateClip(clip.id, { status: "cutting", stage: "Cutting preview", progress: 10 });
      await cutClip(entry, {
        videoId: clip.videoId,
        sourceUrl: video.sourceUrl,
        start: clip.start,
        end: clip.end,
        outPath: previewPath,
        height: previewHeight(video.heights),
        crf: 23,
        onProgress: (pct) => {
          // preview = 10..100
          updateClip(clip.id, { progress: Math.round(10 + pct * 0.88), stage: "Cutting preview" });
        },
      }, getFresh);

      updateClip(clip.id, { stage: "Finishing", progress: 98, hasPreview: true });
      const posterOk = await makePoster(previewPath, posterPath);
      updateClip(clip.id, {
        status: "ready",
        stage: "Ready",
        progress: 100,
        hasPreview: true,
        hasPoster: posterOk,
        error: undefined,
      });
    } catch (e) {
      updateClip(clip.id, {
        status: "error",
        stage: "Error",
        error: (e as Error).message?.slice(0, 220) || "Cut failed.",
      });
    }
    persist();
  });
}

export function enqueueRender(render: RenderJob) {
  enqueue(async () => {
    const clip = getClip(render.clipId);
    const video = clip ? getVideo(clip.videoId) : undefined;
    if (!clip || !video) {
      updateRender(render.id, { status: "error", error: "Clip missing." });
      return;
    }
    try {
      updateRender(render.id, { status: "rendering", progress: 5 });
      const entry = await getFormats(clip.videoId, video.sourceUrl);
      const getFresh = () => refreshFormats(clip.videoId, video.sourceUrl);

      const outPath = clipFilePath(clip.id, render.quality);
      const isMp3 = render.quality === "mp3";
      const height = isMp3 ? null : parseInt(render.quality, 10) || null;

      const opts = {
        videoId: clip.videoId,
        sourceUrl: video.sourceUrl,
        start: clip.start,
        end: clip.end,
        outPath,
        crf: 18,
        onProgress: (pct: number) => updateRender(render.id, { progress: Math.round(4 + pct * 0.94) }),
      };

      if (isMp3) {
        await renderMp3(entry, opts, getFresh);
      } else {
        await cutClip(entry, { ...opts, height }, getFresh);
      }

      updateRender(render.id, { status: "ready", progress: 100 });
      const c = getClip(clip.id);
      if (c && !c.renderedQualities.includes(render.quality)) {
        updateClip(clip.id, { renderedQualities: [...c.renderedQualities, render.quality] });
      }
    } catch (e) {
      updateRender(render.id, {
        status: "error",
        error: (e as Error).message?.slice(0, 220) || "Render failed.",
      });
    }
    persist();
  });
}

export function queueStats() {
  const q = g.__opalQueue!;
  return { queued: q.queue.length, active: q.active };
}
