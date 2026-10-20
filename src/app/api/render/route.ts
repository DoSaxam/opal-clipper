import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { addRender, getClip, getVideo, type RenderJob } from "@/lib/server/state";
import { enqueueRender } from "@/lib/server/scheduler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { clipIds?: string[]; quality?: string };
    const clipIds = Array.isArray(body.clipIds) ? body.clipIds.filter((x) => typeof x === "string") : [];
    const quality = String(body.quality || "");
    if (!clipIds.length) return NextResponse.json({ error: "No clips selected." }, { status: 400 });
    if (!/^\d{3,4}$|^mp3$/.test(quality))
      return NextResponse.json({ error: "Pick a valid quality." }, { status: 400 });

    const video = clipIds.length ? getVideo(getClip(clipIds[0])?.videoId || "") : undefined;
    if (video && /^\d+$/.test(quality)) {
      const q = parseInt(quality, 10);
      if (video.heights.length && q > video.heights[0]) {
        return NextResponse.json(
          { error: `Best available for this video is ${video.heights[0]}p.` },
          { status: 400 }
        );
      }
    }

    const renders: RenderJob[] = [];
    for (const clipId of clipIds) {
      const clip = getClip(clipId);
      if (!clip) continue;
      const r = addRender({
        id: randomUUID(),
        clipId,
        quality,
        status: "queued",
        progress: 0,
        createdAt: Date.now(),
      });
      renders.push(r);
      if (r.status === "queued") enqueueRender(r);
    }

    return NextResponse.json({ renders });
  } catch {
    return NextResponse.json({ error: "Could not start renders." }, { status: 500 });
  }
}
