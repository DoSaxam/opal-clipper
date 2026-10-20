import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { addClip, getVideo, type Clip } from "@/lib/server/state";
import { enqueueClipCut } from "@/lib/server/scheduler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RangeInput {
  start: number;
  end: number;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { videoId?: string; ranges?: RangeInput[] };
    const videoId = body.videoId || "";
    const ranges = Array.isArray(body.ranges) ? body.ranges : [];
    const video = getVideo(videoId);

    if (!video) return NextResponse.json({ error: "Analyze the video first." }, { status: 400 });
    if (!ranges.length) return NextResponse.json({ error: "Add at least one timestamp." }, { status: 400 });
    if (ranges.length > 50) return NextResponse.json({ error: "Max 50 clips at once." }, { status: 400 });

    const clean: RangeInput[] = [];
    for (const r of ranges) {
      const start = Math.max(0, Number(r.start));
      const end = Number(r.end);
      if (!Number.isFinite(start) || !Number.isFinite(end) || end - start < 1) {
        return NextResponse.json(
          { error: `Invalid range: ${r.start}–${r.end}. Each clip needs to be at least 1 second.` },
          { status: 400 }
        );
      }
      const maxEnd = video.duration > 0 ? video.duration : end;
      if (end > maxEnd + 0.75) {
        return NextResponse.json(
          { error: `Timestamp ${Math.floor(end)}s is past the end of this video (${Math.floor(video.duration)}s).` },
          { status: 400 }
        );
      }
      clean.push({ start: Math.min(start, maxEnd - 1 < 0 ? start : Math.min(start, maxEnd - 1)), end });
    }

    const clips: Clip[] = clean.map((r) => ({
      id: randomUUID(),
      videoId,
      start: r.start,
      end: r.end,
      status: "queued",
      progress: 0,
      stage: "Queued",
      createdAt: Date.now(),
      hasPreview: false,
      hasPoster: false,
      renderedQualities: [],
    }));

    for (const clip of clips) {
      addClip(clip);
      enqueueClipCut(clip);
    }

    return NextResponse.json({ clips });
  } catch {
    return NextResponse.json({ error: "Could not create clips." }, { status: 500 });
  }
}
