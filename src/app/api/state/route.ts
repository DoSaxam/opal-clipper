import { NextResponse } from "next/server";
import { getStore } from "@/lib/server/state";
import { getTunnelStatus } from "@/lib/server/tunnel";
import { queueStats } from "@/lib/server/scheduler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const state = getStore();
  const [tunnel] = await Promise.all([getTunnelStatus()]);
  return NextResponse.json({
    videos: state.videos,
    clips: state.clips,
    renders: state.renders,
    queue: queueStats(),
    tunnel,
  });
}
