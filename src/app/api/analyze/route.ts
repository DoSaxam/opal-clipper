import { NextResponse } from "next/server";
import { extractVideo, ExtractionError } from "@/lib/server/ytdlp";
import { upsertVideo } from "@/lib/server/state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { url?: string };
    const url = (body.url || "").trim();
    if (!url || !/^https?:\/\//i.test(url)) {
      return NextResponse.json({ error: "Paste a valid video link (https://…)" }, { status: 400 });
    }
    const video = await extractVideo(url);
    upsertVideo(video);
    return NextResponse.json({ video });
  } catch (e) {
    const msg = e instanceof ExtractionError ? e.message : "Could not analyze this link.";
    return NextResponse.json({ error: msg }, { status: 422 });
  }
}
