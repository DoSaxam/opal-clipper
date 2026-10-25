import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { getStore } from "@/lib/server/state";
import { getTunnelStatus } from "@/lib/server/tunnel";
import { queueStats } from "@/lib/server/scheduler";
import { clipDir } from "@/lib/server/paths";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** REAL file size on disk (not an estimate) — undefined when the file is gone. */
function realSize(file?: string): number | undefined {
  if (!file) return undefined;
  try {
    return fs.statSync(file).size;
  } catch {
    return undefined;
  }
}

export async function GET() {
  const state = getStore();
  const [tunnel] = await Promise.all([getTunnelStatus()]);

  const clips = state.clips.map((c) => ({
    ...c,
    previewBytes: c.hasPreview ? realSize(path.join(clipDir(c.id), "preview.mp4")) : undefined,
  }));

  const renders = state.renders.map((r) => {
    if (r.status !== "ready") return { ...r, sizeBytes: undefined };
    const ext = r.quality === "mp3" ? "mp3" : "mp4";
    return {
      ...r,
      sizeBytes: realSize(path.join(clipDir(r.clipId), `q_${r.quality}.${ext}`)),
    };
  });

  return NextResponse.json({
    videos: state.videos,
    clips,
    renders,
    queue: queueStats(),
    tunnel,
  });
}
